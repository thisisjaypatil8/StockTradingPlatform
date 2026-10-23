const { User } = require("../models");
const ExpressError = require("../utils/ExpressError");

function buildFundsResponse(user, message = null) {
    const funds = user.funds || {};
    const response = {
        success: true,
        availableCash: funds.availableCash !== undefined ? funds.availableCash : 100000,
        marginBlocked: funds.marginBlocked !== undefined ? funds.marginBlocked : 0,
        totalDeposited: funds.totalDeposited !== undefined ? funds.totalDeposited : 100000,
        totalWithdrawn: funds.totalWithdrawn || 0,
        lifetimeRealizedPnL: funds.lifetimeRealizedPnL || 0,
    };
    if (message) {
        response.message = message;
    }
    return response;
}


/**
 * Retrieve user cash balance and margin utilization metrics.
 */
module.exports.getFunds = async (req, res) => {
    const user = await User.findById(req.user.id).lean();

    if(!user) throw new ExpressError(404, "User not found!");

    res.status(200).json(buildFundsResponse(user));
};

const MAX_SINGLE_DEPOSIT = 100000;

/**
 * Atomic wallet deposit.
 */
module.exports.addFunds = async (req, res) => {
    const amount = Number(req.body.amount);

    if(!amount || isNaN(amount) || amount <= 0){
        throw new ExpressError(400, "Please enter a valid deposite amount greater than ₹0")
    }

    if (amount > MAX_SINGLE_DEPOSIT){
        throw new ExpressError(
            400,
            `Single deposit limit is ₹${MAX_SINGLE_DEPOSIT.toLocaleString('en-IN')}. Please contact support for larger transfers.`
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {$inc: {"funds.availableCash": amount, "funds.totalDeposited":amount} },
        {returnDocument: 'after'}
    );

    res.status(200).json(buildFundsResponse(updatedUser, `₹${amount.toLocaleString('en-IN')} deposited successfully!`));
};

/**
 * Atomic wallet withdrawal with available balance guard.
 */
module.exports.withdrawFunds = async (req, res) => {
    const amount = Number(req.body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
        throw new ExpressError(400, "Please enter a valid withdrawal amount greater than ₹0!");
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: req.user.id, "funds.availableCash": { $gte: amount } },
        { $inc: { "funds.availableCash": -amount, "funds.totalWithdrawn":amount } },
        { returnDocument: 'after' }
    );
    if (!updatedUser) {
        throw new ExpressError(400, "Insufficient funds! You cannot withdraw more than your available cash.");
    }
   res.status(200).json(buildFundsResponse(updatedUser, `₹${amount.toLocaleString('en-IN')} withdrawn successfully!`));
};