const YahooFinance = require("yahoo-finance2").default;
const LRUCache = require("../utils/lruCache");

// Initialize Yahoo Finance Client
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const ALIASES = Object.freeze({
    HUL: "HINDUNILVR",
});

const RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y"]);
const INTERVALS = new Set(["1m", "5m", "15m", "30m", "1h", "1d"]);

const CACHE_TTL = Object.freeze({
    QUOTE: 60_000,          // 1 minute
    HISTORY: 300_000,       // 5 minutes
    SEARCH: 300_000,        // 5 minutes
    INDICES: 30_000         // 30 seconds
});

// Bounded LRU Caches (Zero Unbounded Memory Leaks)
const quoteCache = new LRUCache({ max: 500, ttlMs: CACHE_TTL.QUOTE });
const historyCache = new LRUCache({ max: 200, ttlMs: CACHE_TTL.HISTORY });
const searchCache = new LRUCache({ max: 300, ttlMs: CACHE_TTL.SEARCH });
const indicesCache = new LRUCache({ max: 10, ttlMs: CACHE_TTL.INDICES });

// Shared In-Flight Map for single-flight deduplication
const inFlight = new Map();

// Max concurrency for quote requests to prevent overwhelming Yahoo Finance
const MAX_QUOTE_CONCURRENCY = 3;

const INDEX_FALLBACK = Object.freeze({
    nifty: {
        name: "NIFTY 50",
        price: 24952.10,
        change: 103.26,
        percent: "+0.421%",
        isLoss: false
    },
    sensex:{
        name:"SENSEX",
        price: 83983.22,
        change: 563.75,
        percent: "+0.67%",
        isLoss: false
    }
});

module.exports = {
    yahooFinance,
    ALIASES,
    RANGES,
    INTERVALS,
    quoteCache,
    historyCache,
    searchCache,
    indicesCache,
    inFlight,
    MAX_QUOTE_CONCURRENCY,
    INDEX_FALLBACK,
};
