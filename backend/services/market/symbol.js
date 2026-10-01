const ExpressError = require("../../utils/ExpressError");
const { ALIASES } = require("./config");

function validateSymbol(symbol) {
    if (!symbol || !/^[A-Za-z0-9.-]{1,20}$/.test(symbol)) {
        throw new ExpressError(400, "Invalid symbol format");
    }
}

function resolveSymbol(symbol) {
    const upper = symbol.toUpperCase();
    const ticker = ALIASES[upper] || upper;
    return ticker.includes(".") ? ticker : `${ticker}.NS`;
}

module.exports = {
    validateSymbol,
    resolveSymbol,
};
