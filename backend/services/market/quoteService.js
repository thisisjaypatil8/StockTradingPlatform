const ExpressError = require("../../utils/ExpressError");
const { asyncPool } = require("../../utils/concurrency");
const { yahooFinance, quoteCache, inFlight } = require("./config");
const { validateSymbol, resolveSymbol } = require("./symbol");
const { formatQuote } = require("./formatters");
const { withCache } = require("./withCache");

// 1. Single Quote Engine
async function getSingleQuote(symbol) {
    validateSymbol(symbol);
    const yahooSymbol = resolveSymbol(symbol);

    return withCache(quoteCache, inFlight, yahooSymbol, async () => {
        try {
            const q = await yahooFinance.quote(yahooSymbol);
            if (!q || q.regularMarketPrice == null) {
                throw new ExpressError(404, `Stock symbol '${symbol}' not found!`);
            }
            return formatQuote(q, symbol);
        } catch (err) {
            if (err instanceof ExpressError) throw err;
            throw new ExpressError(500, `Market data error for '${symbol}': ${err.message}`);
        }
    });
}

// 2. Throttled Batch Quotes Engine (Max 4 concurrent requests via Semaphore)
async function getBatchQuotes(symbols = []) {
    const quotes = {};

    const tasks = symbols.map((sym) => async () => {
        try {
            const quote = await getSingleQuote(sym);
            quotes[sym.toUpperCase()] = quote;
        } catch (err) {
            console.warn(`[BatchQuote] Failed to fetch ${sym}:`, err.message);
            quotes[sym.toUpperCase()] = null;
        }
    });

    await asyncPool(tasks, 4);
    return quotes;
}

// 3. Current Stock Price (Internal Helper for RMS Liquidation)
async function getCurrentStockPrice(symbol) {
    try {
        const quote = await getSingleQuote(symbol);
        return quote.price;
    } catch (err) {
        console.warn(`[getCurrentStockPrice] Fetch error for ${symbol}:`, err.message);
        return null;
    }
}

module.exports = {
    getSingleQuote,
    getBatchQuotes,
    getCurrentStockPrice,
};
