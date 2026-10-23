const { executeGlobalAutoSquareOff } = require("./rmsService");
const { getISTDate } = require("../utils/time");
const Positions = require("../models/Position");

function startRmsScheduler() {
    console.log("RMS Scheduler Started...");

    // Poll trading window status at 60-second intervals
    setInterval(async () => {
        try {
            const istDate = getISTDate();
            const day = istDate.getDay();
            const isWeekday = day >= 1 && day <= 5;
            const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
            const SQUARE_OFF_MINUTES = 15 * 60 + 20; // 15:20 IST (3:20 PM)
            // State-driven: On weekdays after 15:20, only trigger if actual open positions exist.
            if (isWeekday && currentMinutes >= SQUARE_OFF_MINUTES) {
                const hasOpenPositions = await Positions.exists({
                    product: "MIS",
                    $or: [
                        { netQty: { $ne: 0 } },
                        { qty: { $ne: 0 } }
                    ]
                });

                if (hasOpenPositions) {
                    console.log("RMS Daemon: Open MIS positions exist. Executing Global Auto Square Off at", new Date().toISOString());
                    const result = await executeGlobalAutoSquareOff();
                    console.log(`RMS Daemon: Execution Completed. (${result.squaredOffCount} positions squared off. Total P&L settled: ₹${result.totalSettledAmount})`);
                }
            }
        } catch (error) {
            console.error("RMS Daemon Error:", error.message);
        }
    }, 60000);
}

module.exports = { startRmsScheduler };