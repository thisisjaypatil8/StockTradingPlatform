const { Positions } = require("../models");
const { getISTStartOfDay } = require("../utils/time");
const rmsService = require("../services/rmsService");

/**
 * Retrieve user intraday and derivative positions, purging stale settled intraday records.
 */
module.exports.getAllPositions = async (req, res) => {
    const istDate = getISTStartOfDay(new Date());

    // Purge settled intraday positions prior to current trading session
    await Positions.deleteMany({
        user: req.user.id,
        product: "MIS",
        netQty: 0,
        qty: 0,
        updatedAt: { $lt: istDate }
    });

    const allPositions = await Positions.find({ user: req.user.id }).lean();
    res.status(200).json(allPositions);
};

/**
 * On-demand risk management square-off for all open user MIS positions.
 */
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
