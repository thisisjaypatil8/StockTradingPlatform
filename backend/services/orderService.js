const mongoose = require("mongoose");
const Orders = require("../model/OrdersModel");
const Holdings = require("../model/HoldingsModel");
const Positions = require("../model/PositionsModel");
const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");

const round2 = (value) => Number(value.toFixed(2));

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
        { session }
    );
}

// CNC LOGIC
async function executeCncOrder({ userId, name, orderQty, orderPrice, mode, session }) {
    const holding = await Holdings.findOne({ name, user: userId }).session(session);

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
        return;
    }

    // ---------------- SELL ----------------
    if (mode === "SELL") {
        if (!holding || holding.qty < orderQty) {
            throw new ExpressError(
                400,
                `Insufficient holdings! You only own ${
                    holding ? holding.qty : 0
                } shares of ${name}.`
            );
        }

        const sellProceeds = round2(orderQty * orderPrice);

        await creditCash(userId, sellProceeds, session);

        if (holding.qty === orderQty) {
            await Holdings.deleteOne({ _id: holding._id }, { session });
        } else {
            holding.qty -= orderQty;
            holding.price = orderPrice;
            await holding.save({ session });
        }
    }
}

// MIS HELPERS
function resetClosedPosition(position) {
    position.realizedPnL = 0;
    position.buyQty = 0;
    position.sellQty = 0;
    position.buyAvg = 0;
    position.sellAvg = 0;
}

async function createMisPosition({ userId, name, orderQty, orderPrice, mode, session
}) {
    const isBuy = mode === "BUY";

    const position = new Positions({
        name,
        product: "MIS",
        user: userId,

        qty: isBuy ? orderQty : -orderQty,
        netQty: isBuy ? orderQty : -orderQty,

        buyQty: isBuy ? orderQty : 0,
        buyAvg: isBuy ? orderPrice : 0,

        sellQty: isBuy ? 0 : orderQty,
        sellAvg: isBuy ? 0 : orderPrice,

        avg: orderPrice,
        price: orderPrice,

        realizedPnL: 0,
        net: "+0.00%",
        day: "+0.00%",
        isLoss: false
    });
    await position.save({ session });
}

function updateMisPosition(position, mode, orderQty, orderPrice) {
    const prevNetQty = position.netQty !== undefined ? position.netQty : position.qty;

    let realizedDiff = 0;

    // ---------------- BUY ----------------
    if (mode === "BUY") {
        if (prevNetQty < 0) {
            const shortCoverQty = Math.min(orderQty, Math.abs(prevNetQty));
            realizedDiff += (position.sellAvg - orderPrice) * shortCoverQty;
        }

        const previousBuyTotal = (position.buyQty || 0) * (position.buyAvg || 0);
        const newBuyTotal = previousBuyTotal + (orderQty * orderPrice);
        const newBuyQty = (position.buyQty || 0) + orderQty;

        position.buyQty = newBuyQty;
        position.buyAvg = round2(newBuyTotal / newBuyQty);
    }

    // ---------------- SELL ----------------
    if (mode === "SELL") {
        if (prevNetQty > 0) {
            const longExitQty = Math.min(orderQty, prevNetQty);
            realizedDiff += (orderPrice - position.buyAvg) * longExitQty;
        }

        const previousSellTotal = (position.sellQty || 0) * (position.sellAvg || 0);
        const newSellTotal = previousSellTotal + (orderQty * orderPrice);
        const newSellQty = (position.sellQty || 0) + orderQty;

        position.sellQty = newSellQty;
        position.sellAvg = round2(newSellTotal / newSellQty);
    }

    // ---------------- P&L ----------------
    realizedDiff = round2(realizedDiff);
    position.realizedPnL = round2((position.realizedPnL || 0) + realizedDiff);

    // ---------------- NET POSITION ----------------
    const newNetQty = position.buyQty - position.sellQty;

    position.netQty = newNetQty;
    position.qty = newNetQty;

    if (newNetQty > 0) {
        position.avg = position.buyAvg;
    } else if (newNetQty < 0) {
        position.avg = position.sellAvg;
    } else {
        position.avg = position.buyAvg || position.sellAvg || orderPrice;
    }

    position.price = orderPrice;
    return realizedDiff;
}

// MIS Logic
async function executeMisOrder({userId, name, orderQty, orderPrice, mode, session
}) {
    let position = await Positions.findOne({
        name,
        user: userId,
        product: "MIS"
    }).session(session);


    // Closed position → start fresh
    if (
        position &&
        (position.netQty === 0 || position.qty === 0)
    ) {
        resetClosedPosition(position);
    }


    // First MIS order
    if (!position) {
        await createMisPosition({ userId, name, orderQty, orderPrice, mode, session });
        return;
    }


    // Existing position
    const realizedDiff = updateMisPosition(position, mode, orderQty, orderPrice);


    // Settle realized P&L into wallet
    if (realizedDiff !== 0) {
        await creditCash(userId, realizedDiff, session);
    }


    await position.save({ session });
}

// MAIN ORDER SERVICE
async function executeOrder({userId, name, qty, price, mode, product = "CNC"
}) {
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    const session = await mongoose.startSession();

    let executedOrder = null;

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
                await executeCncOrder({ userId, name, orderQty, orderPrice, mode, session });
            } else {
                await executeMisOrder({ userId, name, orderQty, orderPrice, mode, session });
            }
        });

    } finally {
        await session.endSession();
    }

    return executedOrder;
}


module.exports = {
    executeOrder
};