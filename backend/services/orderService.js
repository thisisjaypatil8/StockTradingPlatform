const mongoose = require("mongoose");

const Orders = require("../model/OrdersModel");
const Holdings = require("../model/HoldingsModel");
const Positions = require("../model/PositionsModel");
const User = require("../model/UserModel");

const ExpressError = require("../utils/ExpressError");
const { round2 } = require("../utils/math");

// constants
const PRODUCTS = {
    CNC: "CNC",
    MIS: "MIS",
}
const SIDES = {
    BUY: "BUY",
    SELL: "SELL",
}
const MIS_LEVERAGE = 5;

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
async function recordRealizedPnL(userId, amount, session) {
    if (amount === 0) return;
    return User.findByIdAndUpdate(
        userId,
        { $inc: { "funds.lifetimeRealizedPnL": amount } },
        { session }
    );
}

// CNC Execution
async function executeCncBuy({ userId, name, orderQty, orderPrice, session }) {
    const orderCost = round2(orderQty * orderPrice);

    await debitCash(userId, orderCost, session);

    const holding = await Holdings.findOne({ name, user: userId }).session(session);

    if (!holding) {
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
        return { realizedPnL: 0 };
    }
    const totalCost = holding.qty * holding.avg + orderCost;
    const totalQty = holding.qty + orderQty;

    holding.qty = totalQty;
    holding.avg = round2(totalCost / totalQty);
    holding.price = orderPrice;

    await holding.save({ session });
    return { realizedPnL: 0 };
}

async function executeCncSell({ userId, name, orderQty, orderPrice, session }) {
    const holding = await Holdings.findOne({ name, user: userId }).session(session);

    if (!holding || holding.qty < orderQty) {
        throw new ExpressError(
            400,
            `Insufficient holdings! You only own ${holding?.qty || 0} shares of ${name}.`
        );
    }

    const sellProceeds = round2(orderQty * orderPrice);
    const realizedPnL = round2((orderPrice - holding.avg) * orderQty);

    await creditCash(userId, sellProceeds, session);

    // Record CNC Realized P&L in User Ledger
    await recordRealizedPnL(userId, realizedPnL, session);

    if (holding.qty === orderQty) {
        await Holdings.deleteOne({ _id: holding._id }, { session });
    } else {
        holding.qty -= orderQty;
        holding.price = orderPrice;

        await holding.save({ session });
    }
    return { realizedPnL };
}

async function executeCncOrder({ userId, name, orderQty, orderPrice, mode, session }) {
    if (mode === SIDES.BUY) {
        return executeCncBuy({ userId, name, orderQty, orderPrice, session })
    }
    if (mode === SIDES.SELL) {
        return executeCncSell({ userId, name, orderQty, orderPrice, session })
    }
}


// MIS position calculations
function calculateMarginBlocked(qty, avgPrice) {
    return round2((Math.abs(qty) * avgPrice) / MIS_LEVERAGE);
}

function syncLegacyPositionFields(position, qty, avgPrice) {
    if (qty > 0) {
        position.buyQty = qty;
        position.buyAvg = avgPrice;

        position.sellQty = 0;
        position.sellAvg = 0;

        return;
    }
    if (qty < 0) {
        position.sellQty = Math.abs(qty);
        position.sellAvg = avgPrice;

        position.buyQty = 0;
        position.buyAvg = 0;

        return;
    }
    position.buyQty = 0;
    position.buyAvg = 0;
    position.sellQty = 0;
    position.sellAvg = 0;
}
// MIS fill engine
function applyFill(position, side, orderQty, orderPrice) {
    const currentQty = position.netQty ?? position.qty ?? 0;
    const currentAvg = position.avgEntry ?? position.avg ?? 0;

    let newQty = currentQty;
    let newAvg = currentAvg;
    let realizedDelta = 0;

    // Buy
    if (side === SIDES.BUY) {
        // Case 1: BUY into Long
        if (currentQty >= 0) {
            newAvg = ((currentQty * currentAvg) + (orderQty * orderPrice)) / (currentQty + orderQty);
            newQty = currentQty + orderQty;
        }
        // Case 2: BUY to reduce short
        else if (orderQty <= Math.abs(currentQty)) {
            realizedDelta = (currentAvg - orderPrice) * orderQty;
            newQty = currentQty + orderQty;
            newAvg = newQty === 0 ? 0 : currentAvg;
        }
        // Case 3: BUY and flip short -> long
        else {
            const coverQty = Math.abs(currentQty);
            realizedDelta = (currentAvg - orderPrice) * coverQty;
            newQty = orderQty - coverQty;
            newAvg = orderPrice;
        }
    }

    // Sell
    else if (side === SIDES.SELL) {
        // Case 4: Sell into long
        if (currentQty > 0 && orderQty <= currentQty) {
            realizedDelta = (orderPrice - currentAvg) * orderQty;
            newQty = currentQty - orderQty;
            newAvg = newQty === 0 ? 0 : currentAvg;
        }
        // Case 5: SELL and flip long -> short
        else if (currentQty > 0 && orderQty > currentQty) {
            const exitQty = currentQty;
            realizedDelta = (orderPrice - currentAvg) * exitQty;
            newQty = -(orderQty - exitQty);
            newAvg = orderPrice;
        }
        // Case 6: Sell into short
        else {
            const absQty = Math.abs(currentQty);
            newAvg = ((absQty * currentAvg) + (orderQty * orderPrice)) / (absQty + orderQty);
            newQty = currentQty - orderQty;
        }
    }

    realizedDelta = round2(realizedDelta);
    newAvg = round2(newAvg);

    // Margin Blocked for MIS (5x Leverage: 20% margin)
    const marginBlocked = calculateMarginBlocked(newQty, newAvg);

    // update position document
    position.netQty = newQty;
    position.qty = newQty;

    position.avgEntry = newAvg;
    position.avg = newAvg;

    position.price = orderPrice;
    position.marginBlocked = marginBlocked;
    position.realizedPnL = round2((position.realizedPnL || 0) + realizedDelta);

    // Legacy sync
    syncLegacyPositionFields(position, newQty, newAvg);

    return { realizedDelta, newQty, newAvg, marginBlocked };
}

// MIS Position execution
function createEmptyMisPosition({ name, userId, orderPrice, }) {
    return new Positions({
        name,
        product: PRODUCTS.MIS,
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

async function executeMisOrder({ userId, name, orderQty, orderPrice, mode, session }) {
    let position = await Positions.findOne({
        name,
        user: userId,
        product: "MIS"
    }).session(session);

    if (!position) {
        position = createEmptyMisPosition({ name, userId, orderPrice });
    }

    // Apply fill using 6-state matrix
    const { realizedDelta } = applyFill(position, mode, orderQty, orderPrice);

    // Settle realized P&L into wallet
    if (realizedDelta !== 0) {
        await creditCash(userId, realizedDelta, session);
        await recordRealizedPnL(userId, realizedDelta, session);
    }

    await position.save({ session });
    return { realizedPnL: realizedDelta };
}

// MAIN ORDER EXECUTION
async function executeOrder({ userId, name, qty, price, mode, product = PRODUCTS.CNC }) {
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    const session =
        await mongoose.startSession();

    let executedOrder = null;
    let executionSettlement = {
        realizedPnL: 0
    };

    try {
        await session.withTransaction(async () => {

            // 1. Create order audit record
            [executedOrder] =
                await Orders.create(
                    [{
                        name,
                        qty: orderQty,
                        price: orderPrice,
                        mode,
                        product,
                        user: userId
                    }],
                    { session }
                );

            // 2. Execute product
            executionSettlement =
                product === PRODUCTS.CNC
                    ? await executeCncOrder({ userId, name, orderQty, orderPrice, mode, session })
                    : await executeMisOrder({ userId, name, orderQty, orderPrice, mode, session });
        });

    } finally {
        await session.endSession();
    }

    //3. Get final wallet state
    const user = 
        await User.findById(userId).lean();

    return {
        executedOrder,

        settlement: {
            realizedPnL: executionSettlement?.realizedPnL || 0,
            availableCash: user?.funds?.availableCash || 0,
            lifetimeRealizedPnL: user?.funds?.lifetimeRealizedPnL || 0
        },
    };
}

module.exports = {
    executeOrder,
    applyFill
};