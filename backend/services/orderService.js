const mongoose = require("mongoose");
const Orders = require("../model/OrdersModel");
const Holdings = require("../model/HoldingsModel");
const Positions = require("../model/PositionsModel");
const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");

const round2 = (value) => Number(Number(value).toFixed(2));

// WALLET HELPERS
async function debitCash(userId, amount, session) {
    const user = await User.findOneAndUpdate(
        { _id: userId, "funds.availableCash": { $gte: amount } },
        { $inc: { "funds.availableCash": -amount } },
        { returnDocument: "after", session }
    );

    if (!user) {
        throw new ExpressError(
            400,
            `Insufficient funds! Required ₹${amount.toLocaleString("en-IN")}`
        );
    }
    return user;
}

async function creditCash(userId, amount, session) {
    return User.findByIdAndUpdate(
        userId,
        { $inc: { "funds.availableCash": amount } },
        { returnDocument: "after", session }
    );
}

// CNC LOGIC
async function executeCncOrder({ userId, name, orderQty, orderPrice, mode, session }) {
    const holding = await Holdings.findOne({ name, user: userId }).session(session);
    let cncRealized = 0;

    // ---------------- BUY ----------------
    if (mode === "BUY") {
        const orderCost = round2(orderQty * orderPrice);

        await debitCash(userId, orderCost, session);

        if (holding) {
            const totalCost = (holding.qty * holding.avg) + orderCost;
            const totalQty = holding.qty + orderQty;

            holding.qty = totalQty;
            holding.avg = round2(totalCost / totalQty);
            holding.price = orderPrice;

            await holding.save({ session });
        } else {
            const newHolding = new Holdings({
                name,
                qty: orderQty,
                avg: orderPrice,
                price: orderPrice,
                net: "+0.00%",
                day: "+0.00%",
                isLoss: false,
                user: userId
            });
            await newHolding.save({ session });
        }
        return { realizedPnL: 0 };
    }

    // ---------------- SELL ----------------
    if (mode === "SELL") {
        if (!holding || holding.qty < orderQty) {
            throw new ExpressError(
                400,
                `Insufficient holdings! You only own ${holding ? holding.qty : 0} shares of ${name}.`
            );
        }

        const sellProceeds = round2(orderQty * orderPrice);
        cncRealized = round2((orderPrice - holding.avg) * orderQty);

        await creditCash(userId, sellProceeds, session);

        // Record CNC Realized P&L in User Ledger
        if (cncRealized !== 0) {
            await User.findByIdAndUpdate(
                userId,
                { $inc: { "funds.lifetimeRealizedPnL": cncRealized } },
                { session }
            );
        }

        if (holding.qty === orderQty) {
            await Holdings.deleteOne({ _id: holding._id }, { session });
        } else {
            holding.qty -= orderQty;
            holding.price = orderPrice;
            await holding.save({ session });
        }
        return { realizedPnL: cncRealized };
    }
}

// 6-STATE MIS SETTLEMENT MATRIX
function applyFill(pos, side, orderQty, orderPrice) {
    const q = pos.netQty !== undefined ? pos.netQty : (pos.qty || 0);
    const avg = pos.avgEntry || pos.avg || 0;
    const p = orderPrice;
    let realizedDelta = 0;
    let newQty = q;
    let newAvg = avg;

    if (side === "BUY") {
        if (q >= 0) {
            // Case 1: BUY into Long (Accumulate)
            newAvg = ((q * avg) + (orderQty * p)) / (q + orderQty);
            newQty = q + orderQty;
            realizedDelta = 0;
        } else if (q < 0 && orderQty <= Math.abs(q)) {
            // Case 2: BUY into Short (Reduce/Cover)
            realizedDelta = (avg - p) * orderQty;
            newQty = q + orderQty;
            newAvg = newQty === 0 ? 0 : avg; // avg unchanged on partial close
        } else if (q < 0 && orderQty > Math.abs(q)) {
            // Case 3: BUY into Short (Flip from Short to Long)
            const coverQty = Math.abs(q);
            realizedDelta = (avg - p) * coverQty;
            newQty = orderQty - coverQty;
            newAvg = p; // New basis established at fill price
        }
    } else if (side === "SELL") {
        if (q > 0 && orderQty <= q) {
            // Case 4: SELL into Long (Reduce/Exit)
            realizedDelta = (p - avg) * orderQty;
            newQty = q - orderQty;
            newAvg = newQty === 0 ? 0 : avg; // avg unchanged on partial close
        } else if (q > 0 && orderQty > q) {
            // Case 5: SELL into Long (Flip from Long to Short)
            const exitQty = q;
            realizedDelta = (p - avg) * exitQty;
            newQty = -(orderQty - exitQty);
            newAvg = p; // New basis established at fill price
        } else if (q <= 0) {
            // Case 6: SELL into Short (Accumulate Short)
            const absQ = Math.abs(q);
            newAvg = ((absQ * avg) + (orderQty * p)) / (absQ + orderQty);
            newQty = q - orderQty;
            realizedDelta = 0;
        }
    }

    realizedDelta = round2(realizedDelta);
    newAvg = round2(newAvg);

    // Margin Blocked for MIS (5x Leverage: 20% margin)
    const marginBlocked = round2((Math.abs(newQty) * newAvg) / 5);

    // Apply updates to position document
    pos.netQty = newQty;
    pos.qty = newQty;
    pos.avgEntry = newAvg;
    pos.avg = newAvg;
    pos.price = p;
    pos.marginBlocked = marginBlocked;
    pos.realizedPnL = round2((pos.realizedPnL || 0) + realizedDelta);

    // Legacy sync
    if (newQty > 0) {
        pos.buyQty = newQty;
        pos.buyAvg = newAvg;
        pos.sellQty = 0;
        pos.sellAvg = 0;
    } else if (newQty < 0) {
        pos.sellQty = Math.abs(newQty);
        pos.sellAvg = newAvg;
        pos.buyQty = 0;
        pos.buyAvg = 0;
    } else {
        pos.buyQty = 0;
        pos.sellQty = 0;
    }

    return { realizedDelta, newQty, newAvg, marginBlocked };
}

// MIS ORDER LOGIC
async function executeMisOrder({ userId, name, orderQty, orderPrice, mode, session }) {
    let position = await Positions.findOne({
        name,
        user: userId,
        product: "MIS"
    }).session(session);

    if (!position) {
        position = new Positions({
            name,
            product: "MIS",
            user: userId,
            netQty: 0,
            qty: 0,
            avgEntry: 0,
            avg: 0,
            price: orderPrice,
            realizedPnL: 0,
            marginBlocked: 0,
            net: "+0.00%",
            day: "+0.00%",
            isLoss: false
        });
    }

    // Apply fill using 6-state matrix
    const { realizedDelta } = applyFill(position, mode, orderQty, orderPrice);

    // Settle realized P&L into wallet
    if (realizedDelta !== 0) {
        await creditCash(userId, realizedDelta, session);
        await User.findByIdAndUpdate(
            userId,
            { $inc: { "funds.lifetimeRealizedPnL": realizedDelta } },
            { session }
        );
    }

    await position.save({ session });
    return { realizedPnL: realizedDelta };
}

// MAIN ORDER SERVICE
async function executeOrder({ userId, name, qty, price, mode, product = "CNC" }) {
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    const session = await mongoose.startSession();
    let executedOrder = null;
    let executionSettlement = { realizedPnL: 0 };

    try {
        await session.withTransaction(async () => {
            // 1. Save audit/order record
            executedOrder = await Orders.create(
                [{
                    name,
                    qty: orderQty,
                    price: orderPrice,
                    mode,
                    product,
                    user: userId
                }],
                { session }
            ).then(([order]) => order);

            // 2. Execute according to product
            if (product === "CNC") {
                executionSettlement = await executeCncOrder({ userId, name, orderQty, orderPrice, mode, session });
            } else {
                executionSettlement = await executeMisOrder({ userId, name, orderQty, orderPrice, mode, session });
            }
        });

    } finally {
        await session.endSession();
    }

    // Retrieve fresh funds snapshot for response
    const freshUser = await User.findById(userId).lean();

    return {
        executedOrder,
        settlement: {
            realizedPnL: executionSettlement?.realizedPnL || 0,
            availableCash: freshUser?.funds?.availableCash || 0,
            lifetimeRealizedPnL: freshUser?.funds?.lifetimeRealizedPnL || 0
        }
    };
}

module.exports = {
    executeOrder,
    applyFill
};