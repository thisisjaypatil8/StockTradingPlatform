const Positions = require("../models/Position");
const marketService = require("./marketService");
const orderService = require("./orderService");

/**
 * RMS Auto Square-off Engine (03:20 PM Liquidation or Manual 1-Click Trigger)
 */
const executeGlobalAutoSquareOff = async (specificUserId = null) => {
    const query = {
        product: "MIS",
        $or: [
            { netQty: { $ne: 0 } },
            { qty: { $ne: 0 } }
        ]
    };
    if (specificUserId) query.user = specificUserId;

    const openPositions = await Positions.find(query);

    if (!openPositions || openPositions.length === 0) {
        return {
            squaredOffCount: 0,
            totalSettledAmount: 0,
            orders: []
        };
    }

    let totalSettledAmount = 0;
    const executedOrders = [];

    for (const pos of openPositions) {
        const net = pos.netQty !== undefined && pos.netQty !== 0 ? pos.netQty : pos.qty;
        if (net === 0) continue;

        const exitMode = net > 0 ? "SELL" : "BUY";
        const exitQty = Math.abs(net);

        let exitPrice = 0;
        try {
            const liveCmp = await marketService.getCurrentStockPrice(pos.name);
            if (typeof liveCmp === "number" && !isNaN(liveCmp) && liveCmp > 0) {
                exitPrice = liveCmp;
            }
        } catch (err) {
            console.warn(`[RMS] Live CMP fetch failed for ${pos.name}: ${err.message}`);
        }

        if (!exitPrice || exitPrice <= 0) {
            exitPrice = pos.price || pos.avgEntry || pos.avg || 0;
        }

        if (!exitPrice || exitPrice <= 0) {
            console.error(`[RMS] CRITICAL: Could not determine valid market exit price for ${pos.name}. Skipping auto square-off.`);
            continue;
        }

        try {
            const rmsIdempotencyKey = `RMS-${pos.user}-${pos.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const { executedOrder, settlement } = await orderService.executeOrder({
                userId: pos.user,
                name: pos.name,
                qty: exitQty,
                price: exitPrice,
                mode: exitMode,
                product: "MIS",
                idempotencyKey: rmsIdempotencyKey
            });

            if (settlement?.realizedPnL) {
                totalSettledAmount += settlement.realizedPnL;
            }
            if (executedOrder) {
                executedOrders.push(executedOrder);
            }
        } catch (posErr) {
            console.error(`[RMS] Failed to square off ${pos.name} for user ${pos.user}:`, posErr.message);
        }
    }

    return {
        squaredOffCount: executedOrders.length,
        totalSettledAmount: Number(totalSettledAmount.toFixed(2)),
        orders: executedOrders
    };
};

module.exports = {
    executeGlobalAutoSquareOff,
};
