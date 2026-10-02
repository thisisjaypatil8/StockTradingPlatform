const ExpressError = require("../utils/ExpressError");
const { round2 } = require("../utils/math");
const { ALIASES } = require("./marketConfig");

const IST_TIME_ZONE = "Asia/Kolkata";

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric"
});

function validateSymbol(symbol) {
    if (!symbol || !/^[A-Za-z0-9.-]{1,20}$/.test(symbol)) {
        throw new ExpressError(400, "Invalid symbol format");
    }
}

function resolveSymbol(symbol) {
    const upper = symbol.toUpperCase();
    const ticker = ALIASES[upper] || upper;
    return ticker.includes(".")
        ? ticker
        : `${ticker}.NS`;
}

function getStartDateForRange(range) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    switch (range) {
        case "1d":
            // Go back 4 days so weekends/holidays always capture the complete latest trading day
            return new Date(now - 4 * day);
        case "5d":
            return new Date(now - 5 * day);
        case "1mo":
            return new Date(now - 30 * day);
        case "3mo":
            return new Date(now - 90 * day);
        case "6mo":
            return new Date(now - 180 * day);
        case "1y":
            return new Date(now - 365 * day);
        default:
            return new Date(now - 1 * day);
    }
}

function formatPercent(change, base) {
    const pct = base ? (change / base) * 100 : 0;
    return `${change >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function formatQuote(q, symbol) {
    const currentPrice = q.regularMarketPrice;
    const previousClose = q.regularMarketPreviousClose ?? currentPrice;
    const change = q.regularMarketChange ?? (currentPrice - previousClose);

    return {
        symbol: q.symbol,
        name: symbol.toUpperCase(),
        price: round2(currentPrice),
        previousClose: round2(previousClose),
        change: round2(change),
        percent: formatPercent(change, previousClose),
        isLoss: change < 0,
        currency: q.currency || "INR",
    };
}

function formatIndex(q, defaultName) {
    const price = q?.regularMarketPrice ?? 0;
    const prevClose = q?.regularMarketPreviousClose ?? price;
    const change = q?.regularMarketChange ?? (price - prevClose);

    return {
        name: defaultName,
        price: round2(price),
        change: round2(change),
        percent: formatPercent(change, prevClose),
        isLoss: change < 0,
    };
}

function formatHistoryLabel(date, range){
    return range === "1d"
        ? timeFormatter.format(date)
        : dateFormatter.format(date);
}

function isIndianEquity(q){
    if(!q?.symbol || typeof q.symbol !== "string"){
        return false;
    }
    
    const isIndian = 
        q.symbol.endsWith(".NS") || 
        q.symbol.endsWith(".BO");
    
    const isEquity = 
        !q.quoteType ||
        q.quoteType === "EQUITY";

    return isIndian && isEquity;
}

function formatSearchResults(quotes){
    return quotes
        .filter(isIndianEquity)
        .slice(0, 8)
        .map(formatSearchResult);
}

function formatSearchResult(q){
    const isBSE = q.symbol.endsWith(".BO");
    const cleanTicker = 
        q.symbol.replace(/\.(NS|BO)$/i, "");

    return{
        symbol: q.symbol,
        name: cleanTicker,
        shortname:
            q.shortname ||
            q.longname ||
            cleanTicker,
        exchange: isBSE ? "BSE" : "NSE",
    };
}

module.exports = {
    validateSymbol,
    resolveSymbol,
    getStartDateForRange,
    formatQuote,
    formatIndex,
    formatHistoryLabel,
    formatSearchResults,
};
