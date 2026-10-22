const { executeGlobalAutoSquareOff } = require("./rmsService");
const { getISTDate } = require("../utils/time");

let lastExecutedDate = "";

function startRmsScheduler() {
    console.log("RMS Scheduler Started...");

    // will check time after every 60 seconds
    setInterval(async () => {
        try {
            const istDate = getISTDate();
            const day = istDate.getDay();
            const hours = istDate.getHours();
            const minutes = istDate.getMinutes();
            const todayStr = istDate.toDateString();

            // Rule: Monday to Friday (After 15:20 IST) (3:20 PM)
            const isWeekday = day >= 1 && day <= 5;
            const currentMinutes = hours * 60 + minutes;
            const SQUARE_OFF_MINUTES = 15 * 60 + 20; // 15:20 IST (3:20 PM)

            // Trigger on weekdays after 15:20 IST if today's auto square-off hasn't run yet
            if (isWeekday && currentMinutes >= SQUARE_OFF_MINUTES && lastExecutedDate !== todayStr) {
                console.log("RMS Daemon: Executing Global Auto Square Off at", new Date().toISOString());

                const result = await executeGlobalAutoSquareOff();
                lastExecutedDate = todayStr;

                console.log(`RMS Daemon: Execution Completed. (${result.squaredOffCount} positions squared off. Total P&L settled: ₹${result.totalSettledAmount})`);
            }
        } catch (error) {
            console.error("RMS Daemon Error:", error.message);
        }
    }, 60000);
}

module.exports = { startRmsScheduler };