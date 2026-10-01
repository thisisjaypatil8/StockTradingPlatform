const ExpressError = require("../../utils/ExpressError");
const { round2 } = require("../../utils/math");
const { yahooFinance, historyCache, inFlight, RANGES } = require("./config");
const { validateSymbol, resolveSymbol } = require("./symbol");
const { withCache } = require("./withCache");

// Reusable static date formatter
const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});

function getStartDateForRange(range) {
    const now = Date.now();
    switch (range) {
        case "1d":
            return new Date(now - 1 * 24 * 60 * 60 * 1000);
        case "5d":
            return new Date(now - 5 * 24 * 60 * 60 * 1000);
        case "1mo":
            return new Date(now - 30 * 24 * 60 * 60 * 1000);
        case "3mo":
            return new Date(now - 90 * 24 * 60 * 60 * 1000);
        case "6mo":
            return new Date(now - 180 * 24 * 60 * 60 * 1000);
        case "1y":
            return new Date(now - 365 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now - 1 * 24 * 60 * 60 * 1000);
    }
}

async function getHistory(symbol, range = "1d", interval = "5m") {
    validateSymbol(symbol);

    if (!RANGES.has(range)) {
        throw new ExpressError(400, `Invalid range! Allowed: ${[...RANGES].join(", ")}`);
    }

    const cacheKey = `${symbol.toUpperCase()}_${range}_${interval}`;
    const yahooSymbol = resolveSymbol(symbol);

    return withCache(historyCache, inFlight, cacheKey, async () => {
        try {
            const chartRes = await yahooFinance.chart(yahooSymbol, {
                period1: getStartDateForRange(range),
                interval,
            });

            const quotes = chartRes.quotes || [];
            const meta = chartRes.meta || {};

            if (quotes.length === 0) {
                throw new ExpressError(404, `No historical data available for '${symbol}'`);
            }

            const labels = [];
            const prices = [];

            for (const item of quotes) {
                if (item.close != null) {
                    const dateObj = new Date(item.date);
                    labels.push(
                        range === "1d"
                            ? timeFormatter.format(dateObj)
                            : dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                    );
                    prices.push(round2(item.close));
                }
            }

            const currentPrice = meta.regularMarketPrice ?? prices[prices.length - 1] ?? 0;
            const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? prices[0] ?? currentPrice;
            const change = currentPrice - previousClose;

            return {
                symbol: meta.symbol || yahooSymbol,
                name: symbol.toUpperCase(),
                currentPrice: round2(currentPrice),
                change: round2(change),
                isLoss: change < 0,
                labels,
                prices,
            };
        } catch (err) {
            if (err instanceof ExpressError) throw err;
            throw new ExpressError(500, `Historical data error for '${symbol}': ${err.message}`);
        }
    });
}

module.exports = {
    getStartDateForRange,
    getHistory,
};
