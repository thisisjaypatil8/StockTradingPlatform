const { round2 } = require("../../utils/math");

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

module.exports = {
    formatPercent,
    formatQuote,
    formatIndex,
};
