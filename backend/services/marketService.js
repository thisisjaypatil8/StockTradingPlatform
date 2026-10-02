const ExpressError = require("../utils/ExpressError");
const { round2 } = require("../utils/math");
const { asyncPool } = require("../utils/concurrency");
const { withCache } = require("../utils/withCache");

const {
    yahooFinance,
    RANGES,
    quoteCache,
    historyCache,
    searchCache,
    indicesCache,
    inFlight,
    MAX_QUOTE_CONCURRENCY,
    INDEX_FALLBACK,
} = require("./marketConfig");

const {
    validateSymbol,
    resolveSymbol,
    getStartDateForRange,
    formatQuote,
    formatIndex,
    formatHistoryLabel,
    formatSearchResults,
} = require("./marketUtils");

// quotes
async function getSingleQuote(symbol) {
    validateSymbol(symbol);
    const yahooSymbol = resolveSymbol(symbol);

    return withCache(quoteCache, inFlight, yahooSymbol, async () => {
        try {
            const quote = await yahooFinance.quote(yahooSymbol);
            if (!quote || quote.regularMarketPrice == null) {
                throw new ExpressError(404, `Stock symbol '${symbol}' not found!`);
            }
            return formatQuote(quote, symbol);
        } catch (err) {
            if (err instanceof ExpressError) throw err;
            throw new ExpressError(500, `Market data error for '${symbol}': ${err.message}`);
        }
    });
}

// 2. Throttled Batch Quotes Engine (Max 4 concurrent requests via Semaphore)
async function getBatchQuotes(symbols = []) {
    const quotes = {};

    const tasks = symbols.map((symbol) => async () => {
        try {
            const quote = await getSingleQuote(symbol);
            quotes[symbol.toUpperCase()] = quote;
        } catch (err) {
            console.warn(`[BatchQuote] Failed to fetch ${symbol}:`, err.message);
            quotes[symbol.toUpperCase()] = null;
        }
    });

    await asyncPool(tasks, MAX_QUOTE_CONCURRENCY);
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

// History
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

            const allQuotes = chartRes.quotes || [];
            const meta = chartRes.meta || {};

            // Filter out null ticks first (Yahoo generates dummy null ticks on holidays/after-hours)
            const validQuotes = allQuotes.filter((q) => q.close != null);

            if (!validQuotes.length) {
                throw new ExpressError(404, `No historical data available for '${symbol}'`);
            }

            // For intraday 1d, isolate only the latest active trading session (9:15 AM to 3:30 PM IST)
            let quotes = validQuotes;
            if (range === "1d") {
                const lastValidQuote = validQuotes[validQuotes.length - 1];
                const lastSessionDateIST = new Date(lastValidQuote.date).toLocaleDateString("en-CA", {
                    timeZone: "Asia/Kolkata",
                });
                quotes = validQuotes.filter((q) => {
                    const qDateIST = new Date(q.date).toLocaleDateString("en-CA", {
                        timeZone: "Asia/Kolkata",
                    });
                    return qDateIST === lastSessionDateIST;
                });
            }

            const labels = [];
            const prices = [];
            const rawCandles = [];

            for (const item of quotes) {
                if (item.close == null) {
                    continue;
                }
                const dateObj = new Date(item.date);
                labels.push(
                    formatHistoryLabel(
                        dateObj,
                        range
                    )
                );
                const closeVal = round2(item.close);
                prices.push(closeVal);

                const timeInSec = Math.floor(dateObj.getTime() / 1000);
                const openVal = item.open != null ? round2(item.open) : closeVal;
                const highVal = item.high != null ? round2(item.high) : Math.max(openVal, closeVal);
                const lowVal = item.low != null ? round2(item.low) : Math.min(openVal, closeVal);

                rawCandles.push({
                    time: timeInSec,
                    open: openVal,
                    high: highVal,
                    low: lowVal,
                    close: closeVal,
                    volume: item.volume ?? 0,
                });
            }

            // Strictly ascending order and deduplicate timestamps for Lightweight Charts
            rawCandles.sort((a, b) => a.time - b.time);
            const candles = [];
            let lastTime = -1;
            for (const c of rawCandles) {
                if (c.time > lastTime) {
                    candles.push(c);
                    lastTime = c.time;
                }
            }

            const currentPrice =
                meta.regularMarketPrice ??
                prices[prices.length - 1] ??
                0;

            const previousClose =
                meta.chartPreviousClose ??
                meta.previousClose ??
                prices[0] ??
                currentPrice;

            const change = currentPrice - previousClose;

            return {
                symbol: meta.symbol || yahooSymbol,
                name: symbol.toUpperCase(),
                currentPrice: round2(currentPrice),
                change: round2(change),
                isLoss: change < 0,
                labels,
                prices,
                candles,
            };
        } catch (err) {
            if (err instanceof ExpressError) throw err;
            throw new ExpressError(500, `Historical data error for '${symbol}': ${err.message}`);
        }
    });
}

// Search
async function searchSymbols(query) {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
        return [];
    }

    const cleanQuery = query.trim();
    const cacheKey = `SEARCH_${cleanQuery.toUpperCase()}`;

    return withCache(searchCache, inFlight, cacheKey, async () => {
        try {
            const response =
                await yahooFinance.search(
                    cleanQuery,
                    { quotesCount: 20, newsCount: 0 }
                );

            return formatSearchResults(response.quotes || []);

        } catch (err) {
            console.warn(`[searchSymbols] Search Failed for '${query}':`, err.message);
            return [];
        }
    });
}

// Market Indices
async function getMarketIndices() {
    const cacheKey = "MARKET_INDICES";
    return withCache(indicesCache, inFlight, cacheKey, async () => {
        try {
            const [niftyQuote, sensexQuote] =
                await Promise.all([
                    yahooFinance.quote("^NSEI"),
                    yahooFinance.quote("^BSESN"),
                ]);

            return {
                nifty: formatIndex(niftyQuote, "NIFTY 50"),
                sensex: formatIndex(sensexQuote, "SENSEX"),
                timestamp: Date.now(),
            };
        } catch (err) {
            console.warn("[getMarketIndices] Yahoo fetch failed, serving safe fallback:", err.message);

            const cached = indicesCache.get("MARKET_INDICES");

            return cached || {
                nifty: { ...INDEX_FALLBACK.nifty },
                sensex: { ...INDEX_FALLBACK.sensex },
                timestamp: Date.now(),
            };
        }
    });
}

module.exports = {
    getSingleQuote,
    getBatchQuotes,
    getCurrentStockPrice,
    getHistory,
    searchSymbols,
    getMarketIndices,
};

