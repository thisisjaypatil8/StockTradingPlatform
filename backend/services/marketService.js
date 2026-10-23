const YahooFinance = require("yahoo-finance2").default;
const ExpressError = require("../utils/ExpressError");
const { round2 } = require("../domain/money");
const { asyncPool } = require("../utils/promisePool");
const LRUCache = require("../utils/lruCache");

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const ALIASES = Object.freeze({
    HUL: "HINDUNILVR",
});

const RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y"]);
const MAX_QUOTE_CONCURRENCY = 3;

const CACHE_TTL = Object.freeze({
    QUOTE: 60_000,    // 1 min
    HISTORY: 300_000, // 5 min
    SEARCH: 300_000,  // 5 min
    INDICES: 30_000   // 30 sec
});

const quoteCache = new LRUCache({ max: 500, ttlMs: CACHE_TTL.QUOTE });
const historyCache = new LRUCache({ max: 200, ttlMs: CACHE_TTL.HISTORY });
const searchCache = new LRUCache({ max: 300, ttlMs: CACHE_TTL.SEARCH });
const indicesCache = new LRUCache({ max: 10, ttlMs: CACHE_TTL.INDICES });
const inFlight = new Map();

const INDEX_FALLBACK = Object.freeze({
    nifty: { name: "NIFTY 50", price: 24952.10, change: 103.26, percent: "+0.42%", isLoss: false },
    sensex: { name: "SENSEX", price: 83983.22, change: 563.75, percent: "+0.67%", isLoss: false }
});

/**
 * Single-flight coalescing cache helper to eliminate duplicate concurrent fetches.
 */
async function withCache(cache, inFlightMap, key, fetchFn) {
    const cached = cache.get(key);
    if (cached) return cached;

    if (inFlightMap.has(key)) {
        return inFlightMap.get(key);
    }

    const promise = (async () => {
        try {
            const data = await fetchFn();
            if (data !== undefined && data !== null) {
                cache.set(key, data);
            }
            return data;
        } finally {
            inFlightMap.delete(key);
        }
    })();

    inFlightMap.set(key, promise);
    return promise;
}

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
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
    return ticker.includes(".") ? ticker : `${ticker}.NS`;
}

function getStartDateForRange(range) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    switch (range) {
        case "1d": return new Date(now - 4 * day); // Go back 4 days so weekends always capture latest trading session
        case "5d": return new Date(now - 5 * day);
        case "1mo": return new Date(now - 30 * day);
        case "3mo": return new Date(now - 90 * day);
        case "6mo": return new Date(now - 180 * day);
        case "1y": return new Date(now - 365 * day);
        default: return new Date(now - 1 * day);
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

function formatHistoryLabel(date, range) {
    return range === "1d" ? timeFormatter.format(date) : dateFormatter.format(date);
}

function formatSearchResults(quotes) {
    return quotes
        .filter((q) => {
            if (!q?.symbol || typeof q.symbol !== "string") return false;
            const isIndian = q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO");
            const isEquity = !q.quoteType || q.quoteType === "EQUITY";
            return isIndian && isEquity;
        })
        .slice(0, 8)
        .map((q) => {
            const isBSE = q.symbol.endsWith(".BO");
            const cleanTicker = q.symbol.replace(/\.(NS|BO)$/i, "");
            return {
                symbol: q.symbol,
                name: cleanTicker,
                shortname: q.shortname || q.longname || cleanTicker,
                exchange: isBSE ? "BSE" : "NSE",
            };
        });
}

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

async function getCurrentStockPrice(symbol) {
    try {
        const quote = await getSingleQuote(symbol);
        return quote.price;
    } catch (err) {
        console.warn(`[getCurrentStockPrice] Fetch error for ${symbol}:`, err.message);
        return null;
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

            const allQuotes = chartRes.quotes || [];
            const meta = chartRes.meta || {};
            const validQuotes = allQuotes.filter((q) => q.close != null);

            if (!validQuotes.length) {
                throw new ExpressError(404, `No historical data available for '${symbol}'`);
            }

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
                if (item.close == null) continue;
                const dateObj = new Date(item.date);
                labels.push(formatHistoryLabel(dateObj, range));
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

            rawCandles.sort((a, b) => a.time - b.time);
            const candles = [];
            let lastTime = -1;
            for (const c of rawCandles) {
                if (c.time > lastTime) {
                    candles.push(c);
                    lastTime = c.time;
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
                candles,
            };
        } catch (err) {
            if (err instanceof ExpressError) throw err;
            throw new ExpressError(500, `Historical data error for '${symbol}': ${err.message}`);
        }
    });
}

async function searchSymbols(query) {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
        return [];
    }
    const cleanQuery = query.trim();
    const cacheKey = `SEARCH_${cleanQuery.toUpperCase()}`;

    return withCache(searchCache, inFlight, cacheKey, async () => {
        try {
            const response = await yahooFinance.search(cleanQuery, { quotesCount: 20, newsCount: 0 });
            return formatSearchResults(response.quotes || []);
        } catch (err) {
            console.warn(`[searchSymbols] Search Failed for '${query}':`, err.message);
            return [];
        }
    });
}

async function getMarketIndices() {
    const cacheKey = "MARKET_INDICES";
    return withCache(indicesCache, inFlight, cacheKey, async () => {
        try {
            const [niftyQuote, sensexQuote] = await Promise.all([
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
    getLiveMarketPrice: getCurrentStockPrice,
    getHistory,
    searchSymbols,
    getMarketIndices,
};
