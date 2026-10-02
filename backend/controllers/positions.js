const Positions = require("../model/PositionsModel");
const { getISTStartOfDay } = require("../utils/time");
const rmsService = require("../services/rmsService");

// 1. Get all positions for logged-in user
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

    // 3. Get all active positions
    const allPositions = await Positions.find({ user: req.user.id }).lean();
    res.status(200).json(allPositions);
};

// 2. HTTP Route Handler (For Manual 1-Click UI Button)
module.exports.squareOffAllPositions = async (req, res) => {
    const result = await rmsService.executeGlobalAutoSquareOff(req.user.id);

    if (result.squaredOffCount === 0) {
        return res.status(200).json({
            success: true,
            message: "No open MIS positions to square off!",
            squaredOffCount: 0,
            settledAmount: 0
        });
    }

    res.status(200).json({
        success: true,
        message: `⚡ RMS Auto Square-off executed! ${result.squaredOffCount} position(s) squared off. Total P&L settled: ₹${result.totalSettledAmount.toFixed(2)}`,
        ...result
    });
};
