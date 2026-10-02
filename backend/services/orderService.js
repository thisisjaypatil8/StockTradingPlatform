const mongoose = require("mongoose");

const Orders = require("../model/OrdersModel");
const Holdings = require("../model/HoldingsModel");
const Positions = require("../model/PositionsModel");
const User = require("../model/UserModel");

const ExpressError = require("../utils/ExpressError");
const { round2 } = require("../utils/math");
const { applyFill: domainApplyFill } = require("../domain/fills");
const { toPaise, toRupees } = require("../domain/money");

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

// Atomically lock margin from availableCash into marginBlocked
async function lockMargin(userId, amount, session) {
    const user = await User.findOneAndUpdate(
        { _id: userId, "funds.availableCash": { $gte: amount } },
        {
            $inc: {
                "funds.availableCash": -amount,
                "funds.marginBlocked": amount
            }
        },
        { returnDocument: "after", session }
    );

    if (!user) {
        throw new ExpressError(
            400,
            `Insufficient funds for intraday margin! Required ₹${amount.toLocaleString("en-IN")}`
        );
    }
    return user;
}

// Atomically release margin from marginBlocked back into availableCash
async function releaseMargin(userId, amount, session) {
    return User.findByIdAndUpdate(
        userId,
        {
            $inc: {
                "funds.availableCash": amount,
                "funds.marginBlocked": -amount
            }
        },
        { returnDocument: "after", session }
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
        product: PRODUCTS.MIS
    }).session(session);

    if (!position) {
        position = createEmptyMisPosition({ name, userId, orderPrice });
    }

    const currentPos = {
        netQty: position.netQty || 0,
        avgPaise: toPaise(position.avgEntry || 0),
    };

    const fill = {
        side: mode,
        qty: orderQty,
        pricePaise: toPaise(orderPrice),
    };

    // 1. Run pure institutional fill engine
    const fillResult = domainApplyFill(currentPos, fill);

    const oldMargin = position.marginBlocked || 0;
    const newNetQty = fillResult.newNetQty;
    const newAvgRupees = toRupees(fillResult.newAvgPaise);
    const realizedDeltaRupees = toRupees(fillResult.realizedDeltaPaise);

    // 2. Compute 5x margin (20% of notional)
    const newMargin = newNetQty === 0
        ? 0
        : round2((Math.abs(newNetQty) * newAvgRupees) / MIS_LEVERAGE);

    const marginDelta = round2(newMargin - oldMargin);

    // 3. Atomically Lock or Release Margin in User Wallet
    if (marginDelta > 0) {
        // Position opened or expanded -> Lock additional cash
        await lockMargin(userId, marginDelta, session);
    } else if (marginDelta < 0) {
        // Position reduced or closed -> Release collateral back to available cash
        await releaseMargin(userId, Math.abs(marginDelta), session);
    }

    // 4. Settle Realized P&L into Wallet
    if (realizedDeltaRupees !== 0) {
        await creditCash(userId, realizedDeltaRupees, session);
        await recordRealizedPnL(userId, realizedDeltaRupees, session);
    }

    // 5. Update Position Document
    position.netQty = newNetQty;
    position.qty = newNetQty;
    position.avgEntry = newAvgRupees;
    position.avg = newAvgRupees;
    position.price = orderPrice;
    position.marginBlocked = newMargin;
    position.realizedPnL = round2((position.realizedPnL || 0) + realizedDeltaRupees);

    syncLegacyPositionFields(position, newNetQty, newAvgRupees);

    await position.save({ session });
    return {
        realizedPnL: realizedDeltaRupees,
        marginBlocked: newMargin
    };
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

    const orderCost = round2(orderQty * orderPrice);
    const cashDiff = product === PRODUCTS.CNC
        ? (mode === SIDES.BUY ? -orderCost : orderCost)
        : (executionSettlement?.realizedPnL || 0);

    return {
        executedOrder,

        settlement: {
            cashDiff,
            realizedPnL: executionSettlement?.realizedPnL || 0,
            marginBlocked: user?.funds?.marginBlocked || 0,
            availableCash: user?.funds?.availableCash || 0,
            lifetimeRealizedPnL: user?.funds?.lifetimeRealizedPnL || 0
        },
    };
}

module.exports = {
    executeOrder,
    applyFill: domainApplyFill,
};