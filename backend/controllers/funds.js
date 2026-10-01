const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");

function buildFundsResponse(user, message = null){
    const funds = user.funds || {};
    const response = {
        success: true,
        availableCash: funds.availableCash !== undefined ? funds.availableCash : 100000,
        totalDeposited: funds.totalDeposited !== undefined ? funds.totalDeposited : 100000,
        totalWithdrawn: funds.totalWithdrawn || 0,
        lifetimeRealizedPnL: funds.lifetimeRealizedPnL || 0,
    };
    if(message){
        response.message = message;
    }

    return response;
};

// 1. Get Live Cash Balance
module.exports.getFunds = async (req, res) => {
    const user = await User.findById(req.user.id);

    if(!user) throw new ExpressError(404, "User not found!");

    // Auto-migrate legacy users who don't have deposit/withdrawal tracking
    if (user.funds && user.funds.totalDeposited == null) {
        user.funds.totalDeposited = 100000;  // Initial balance counts as first deposit
        user.funds.totalWithdrawn = 0;
        await user.save();
    }

    // Fallback for legacy documents
    const availableCash = user.funds?.availableCash !== undefined ? user.funds.availableCash : 100000;

    res.status(200).json(buildFundsResponse(user));
};

//2. Add Funds (Deposit)
module.exports.addFunds = async (req, res) => {
    const amount = Number(req.body.amount);

    if(!amount || isNaN(amount) || amount <= 0){
        throw new ExpressError(400, "Please enter a valid deposite amount greater than ₹0")
    }

    // Atomic increment
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {$inc: {"funds.availableCash": amount, "funds.totalDeposited":amount} },
        {returnDocument: 'after'}
    )

    res.status(200).json(buildFundsResponse(updatedUser, `₹${amount.toLocaleString('en-IN')} deposited successfully!`));
};

//3. Withdraw Funds (With Atomic Balance Protection)
module.exports.withdrawFunds = async (req, res) => {
    const amount = Number(req.body.amount);

    
    if (!amount || isNaN(amount) || amount <= 0) {
        throw new ExpressError(400, "Please enter a valid withdrawal amount greater than ₹0!");
    }
    // Atomic check: deduct only if availableCash >= amount
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