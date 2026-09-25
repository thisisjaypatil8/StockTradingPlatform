const Positions = require("../model/PositionsModel");
const Orders = require("../model/OrdersModel");
const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");

module.exports.getAllPositions = async (req, res) => {
    //1. get Start-of-day IST timestamp for today
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone:"Asia/Kolkata" });
    const istDate = new Date(istString);
    istDate.setHours(0, 0, 0, 0);

    //2. Purge positions older than today because PnL of them is already settled
    await Positions.deleteMany({
        user: req.user.id,
        product: "MIS",
        netQty: 0,
        qty: 0,
        updatedAt: { $lt: istDate }
    });

    //3. Return only those positions which are Open or traded today
    const allPositions = await Positions.find({ user: req.user.id }).lean();
    res.status(200).json(allPositions);
};

// RMS Auto Square-off Engine (03:20 PM Liquidation)
const executeGlobalAutoSquareOff = async (sqecificUserId = null) => {
    //1. Search Open MIS positions of Logged-in user or specific user
    const query = {
        product: "MIS",
        $or: [
            {
                netQty: { $ne: 0 }
            },
            {
                qty: { $ne: 0 }
            }
        ]
    }
    if (sqecificUserId) query.user = sqecificUserId;

    const openPositions = await Positions.find(query);

    if (!openPositions || openPositions.length === 0) {
        return {
            squaredOffCount: 0, totalSettledAmount: 0, orders: []
        };
    }

    let totalSettledAmount = 0;
    const executedOrders = [];

    //2. Liquidate each open position
    for (const pos of openPositions) {
        const net = pos.netQty !== undefined && pos.netQty !== 0 ? pos.netQty : pos.qty;

        if (net === 0) continue;

        // Determine buy/sell
        const exitMode = net > 0 ? "SELL" : "BUY";

        const exitQty = Math.abs(net);
        const exitPrice = pos.price || pos.avg || 100;

        // Realized P&L calc
        let realizedDiff = 0;
        if (exitMode === "SELL") {
            realizedDiff = (exitPrice - (pos.buyAvg || pos.avg)) * exitQty;
        } else {
            realizedDiff = ((pos.sellAvg || pos.avg) - exitPrice) * exitQty;
        }

        realizedDiff = Number(realizedDiff.toFixed(2));
        totalSettledAmount += realizedDiff;

        // Audit trail entry
        const autoOrder = new Orders({
            name: pos.name,
            qty: exitQty,
            price: exitPrice,
            mode: exitMode,
            product: "MIS", // MIS Position closed
            user: pos.user,
        });

        await autoOrder.save();
        executedOrders.push(autoOrder);

        // Update position ledger 
        pos.realizedPnL = Number(((pos.realizedPnL || 0) + realizedDiff).toFixed(2));
        if (exitMode === "SELL") {
            pos.sellQty = (pos.sellQty || 0) + exitQty;
            pos.sellAvg = exitPrice;
        } else {
            pos.buyQty = (pos.buyQty || 0) + exitQty;
            pos.buyAvg = exitPrice;
        }
        pos.netQty = 0;
        pos.qty = 0;
        pos.price = exitPrice;
        await pos.save();

        // 3. Update User Margin 
        if (realizedDiff != 0) {
            await User.findByIdAndUpdate(pos.user, {
                $inc: {
                    "funds.availableCash": Number(realizedDiff.toFixed(2))
                }
            });
        }

    }


    return {
        squaredOffCount: executedOrders.length,
        totalSettledAmount,
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