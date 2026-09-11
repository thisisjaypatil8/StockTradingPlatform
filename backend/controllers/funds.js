const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");

// 1. Get Live Cash Balance
module.exports.getFunds = async (req, res) => {
    const user = await User.findById(req.user.id);

    if(!user) throw new ExpressError(404, "User not found!");

    // Fallback for legacy documents
    const availableCash = user.funds?.availableCash !== undefined ? user.funds.availableCash : 100000;

    res.status(200).json({
        success: true,
        availableCash,
    });
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
        {$inc: {"funds.availableCash": amount} },
        {new: true}
    )

    res.status(200).json({
        success: true,
        message: `₹${amount.toLocaleString('en-IN')} deposited successfully`,
        availableCash: updatedUser.funds.availableCash,
    });
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
        { $inc: { "funds.availableCash": -amount } },
        { new: true }
    );
    if (!updatedUser) {
        throw new ExpressError(400, "Insufficient funds! You cannot withdraw more than your available cash.");
    }
    res.status(200).json({
        success: true,
        message: `₹${amount.toLocaleString("en-IN")} withdrawn successfully!`,
        availableCash: updatedUser.funds.availableCash,
    });
};