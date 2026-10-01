const Positions = require("../model/PositionsModel");
const { getCurrentStockPrice } = require("./market");
const { getISTStartOfDay } = require("../utils/time");

module.exports.getAllPositions = async (req, res) => {
    // 1. Get start-of-day in IST
    const istDate = getISTStartOfDay(new Date());

    // 2. Delete MIS positions older than today (already settled)
    await Positions.deleteMany({
        user: req.user.id,
        product: "MIS",
        netQty: 0,
        qty: 0,
        updatedAt: { $lt: istDate }
    });

    // 3. Get all positions (open + netQty != 0)
    const allPositions = await Positions.find({ user: req.user.id }).lean();
    res.status(200).json(allPositions);
};

const orderService = require("../services/orderService");

// RMS Auto Square-off Engine (03:20 PM Liquidation)
const executeGlobalAutoSquareOff = async (sqecificUserId = null) => {
    // 1. Search Open MIS positions
    const query = {
        product: "MIS",
        $or: [
            { netQty: { $ne: 0 } },
            { qty: { $ne: 0 } }
        ]
    };
    if (sqecificUserId) query.user = sqecificUserId;

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

    // 2. Liquidate each open position via centralized Order Service
    for (const pos of openPositions) {
        const net = pos.netQty !== undefined && pos.netQty !== 0 ? pos.netQty : pos.qty;
        if (net === 0) continue;

        const exitMode = net > 0 ? "SELL" : "BUY";
        const exitQty = Math.abs(net);
        let exitPrice = pos.price || pos.avgEntry || pos.avg || 100;

        try {
            const liveCmp = await getCurrentStockPrice(pos.name);
            if (typeof liveCmp === "number" && !isNaN(liveCmp) && liveCmp > 0) {
                exitPrice = liveCmp;
            }
        } catch (err) {
            console.warn(`[RMS] Live CMP fetch failed for ${pos.name}. Using backup price: ${exitPrice}`);
        }

        // Delegate to single authoritative execution engine
        const { executedOrder, settlement } = await orderService.executeOrder({
            userId: pos.user,
            name: pos.name,
            qty: exitQty,
            price: exitPrice,
            mode: exitMode,
            product: "MIS"
        });

        if (settlement?.realizedPnL) {
            totalSettledAmount += settlement.realizedPnL;
        }
        if (executedOrder) {
            executedOrders.push(executedOrder);
        }
    }

    return {
        squaredOffCount: executedOrders.length,
        totalSettledAmount: Number(totalSettledAmount.toFixed(2)),
        orders: executedOrders
    };
};

//HTTP Route Handler (For Manual 1-Click UI Button)
module.exports.squareOffAllPositions = async (req, res) => {
    const result = await executeGlobalAutoSquareOff(req.user.id);

    if (result.squaredOffCount === 0) {
        return res.status(200).json({
            success: true,
            message: "No open MIS positions to square off!",
            squaredOffCount: 0,
            settledAmount: 0
        });
    }
    // Return success response
    res.status(200).json({
        success: true,
        message: ` RMS Auto Square-off executed! ${result.squaredOffCount} position(s) squared off. Total P&L settled: ₹${result.totalSettledAmount.toFixed(2)}`,
        ...result
    });
};

module.exports.executeGlobalAutoSquareOff = executeGlobalAutoSquareOff;