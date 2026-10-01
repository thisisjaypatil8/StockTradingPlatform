const { executeGlobalAutoSquareOff } = require("../controllers/positions");
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

            // Rule: Monday to Friday (15:20 IST) (3:20 PM)
            const isWeekday = day >= 1 && day <= 5;
            const isSquareOffTime = (hours === 15 && minutes === 20);

            // Check only once in a day
            if (isWeekday && isSquareOffTime && lastExecutedDate !== todayStr) {
                lastExecutedDate = todayStr;
                console.log("RMS Daemon: Executing Global Auto Square Off at ", Date());

                const result = await executeGlobalAutoSquareOff();

                console.log(`RMS Daemon: Execution Completed. (${result.squaredOffCount} positions squared off. Total P&L settled: ₹${result.totalSettledAmount})`);
            }
        } catch (error) {
            console.error("RMS Daemon Error:", error.message);
        }
    }, 60000)
}

module.exports = { startRmsScheduler };