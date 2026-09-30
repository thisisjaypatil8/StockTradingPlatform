const ExpressError = require("../utils/ExpressError");

// config
const ALIASES = Object.freeze({
    HUL: "HINDUNILVR",
});

const RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y"]);
const INTERVALS = new Set(["1m", "5m", "15m", "30m", "1h", "1d"]);

const QUOTE_TTL = 60_000;
const HISTORY_TTL = 300_000;   // 5 min
const FETCH_TIMEOUT = 8_000;

const quoteCache = new Map();
const historyCache = new Map();
const inFlight = new Map();

// utilities
const round2 = value => Number(Number(value).toFixed(2));

function validateSymbol(symbol) {
    if (!symbol || !/^[A-Za-z0-9.-]{1,20}$/.test(symbol)) {
        throw new ExpressError(400, "Invalid symbol format");
    }
}

function resolveSymbol(symbol) {
    const upper = symbol.toUpperCase();
    const ticker = ALIASES[upper] || upper;
    return ticker.includes('.') ? ticker : `${ticker}.NS`;
}

function getCache(cache, key) {
    const entry = cache.get(key);

    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(cache, key, data, ttl) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttl
    });
}

// Yahoo API
async function fetchMarketData(symbol, params, errorMessage) {
    const key = `${symbol}?${params}`;

    // Prevent duplicate upstream requests during a cache miss
    if (inFlight.has(key)) return inFlight.get(key);

    const request = fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`,
        {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT),
        }
    )
        .then(async response => {
            if (!response.ok) {
                throw new ExpressError(
                    response.status,
                    `Yahoo Finance error: ${response.statusText}`
                );
            }

            const data = await response.json();
            const result = data?.chart?.result?.[0];
            if (!result) {
                throw new ExpressError(404, errorMessage);
            }

            return result;
        })
        .catch(err => {
            if (
                err.name === "TimeoutError" || err.name === "AbortError"
            ) {
                throw new ExpressError(504, "Market data request timed out!");
            }
            throw err;
        })
        .finally(() => {
            inFlight.delete(key);
        });
    inFlight.set(key, request);
    return request;
}

// Common Market math
function getPriceSnapshot(meta) {
    const currentPrice = meta.regularMarketPrice;

    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
    const change = currentPrice - previousClose;

    return {
        currentPrice,
        previousClose,
        change,
    };

}

// Controllers

async function getSingleQuote(symbol) {
    validateSymbol(symbol);
    const yahooSymbol = resolveSymbol(symbol);

    const cached = getCache(quoteCache, yahooSymbol);
    if (cached) {
        return cached;
    }

    const result = await fetchMarketData(
        yahooSymbol,
        "range=1d&interval=5m",
        `Stock symbol '${symbol}' not found on Yahoo Finance!`
    );

    const {
        currentPrice, previousClose, change
    } = getPriceSnapshot(result.meta);

    const data = {
        symbol: result.meta.symbol,
        name: symbol.toUpperCase(),
        price: round2(currentPrice),
        previousClose: round2(previousClose),
        change: round2(change),
        percent: `${change >= 0 ? "+" : ""}${(
            previousClose
                ? (change / previousClose) * 100
                : 0
        ).toFixed(2)}%`,
        isLoss: change < 0,
        currency: result.meta.currency || "INR",
    };

    setCache(quoteCache, yahooSymbol, data, QUOTE_TTL);
    return data;
}

// Single Quote Controller
module.exports.getQuote = async (req, res) => {
    const { symbol } = req.params;
    const data = await getSingleQuote(symbol);
    return res.json(data);
};

// Batch Quote Controller (Kills N+1 waterfall)
module.exports.getBatchQuotes = async (req, res) => {
    const rawSymbols = req.query.symbols;
    if (!rawSymbols) {
        return res.status(200).json({});
    }

    const symbols = rawSymbols.split(",").map(s => s.trim()).filter(Boolean);
    const quotes = {};

    await Promise.allSettled(
        symbols.map(async (sym) => {
            try {
                const quote = await getSingleQuote(sym);
                quotes[sym.toUpperCase()] = quote;
            } catch (err) {
                console.warn(`[BatchQuote] Failed to fetch ${sym}:`, err.message);
                quotes[sym.toUpperCase()] = null;
            }
        })
    );

    return res.status(200).json(quotes);
};

async function getCurrentStockPrice(symbol) {
    try {
        const quote = await getSingleQuote(symbol);
        return quote.price;
    } catch (err) {
        console.warn(`[getCurrentStockPrice] Fetch error for ${symbol}:`, err.message);
        return null;
    }
}

module.exports.getCurrentStockPrice = getCurrentStockPrice;


module.exports.getHistory = async (req, res) => {
    const { symbol } = req.params;
    const range = req.query.range || "1d";
    const interval = req.query.interval || "5m";

    validateSymbol(symbol);

    if (!RANGES.has(range)) {
        throw new ExpressError(
            400,
            `Invalid range! Allowed: ${[...RANGES].join(", ")}`
        );
    }

    if (!INTERVALS.has(interval)) {
        throw new ExpressError(
            400,
            `Invalid interval! Allowed: ${[...INTERVALS].join(", ")}`
        );
    }

    const yahooSymbol = resolveSymbol(symbol);
    const cacheKey = `${yahooSymbol}:${range}:${interval}`;

    const cached = getCache(historyCache, cacheKey);

    if (cached) {
        return res.json(cached);
    }

    const result = await fetchMarketData(
        yahooSymbol,
        `range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`,
        `No historical chart data found for ${symbol}`
    );

    const timestamps = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close;

    if (!timestamps || !closes) {
        throw new ExpressError(
            404,
            `No historical chart data found for ${symbol}`
        );
    }

    const labels = [];
    const prices = [];

    for (let i = 0; i < timestamps.length; i++) {
        const price = closes[i];

        if (price == null) continue;

        labels.push(
            new Date(timestamps[i] * 1000)
                .toLocaleTimeString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
        );

        prices.push(round2(price));
    }

    const {
        currentPrice,
        change,
    } = getPriceSnapshot(result.meta);

    const data = {
        symbol: result.meta.symbol,
        name: symbol.toUpperCase(),
        currentPrice: round2(currentPrice),
        change: round2(change),
        isLoss: change < 0,
        labels,
        prices,
    };

    setCache(
        historyCache,
        cacheKey,
        data,
        HISTORY_TTL
    );

    return res.json(data);
};