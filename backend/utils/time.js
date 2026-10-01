// IST Time helpers for trading sessions & RMS
function getISTDate(date = new Date()){
    const istString = date.toLocaleString("en-US", {
        timeZone:"Asia/Kolkata",
    });
    return new Date(istString);
}

function getISTStartOfDay(date = new Date()){
    const istDate = getISTDate(date);
    istDate.setHours(0,0,0,0);
    return istDate;
}

module.exports = {
    getISTDate,
    getISTStartOfDay,
};