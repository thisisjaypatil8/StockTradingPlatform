const YahooFinance = require("yahoo-finance2").default;
const LRUCache = require("../../utils/lruCache");

// Initialize Yahoo Finance Client
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const ALIASES = Object.freeze({
    HUL: "HINDUNILVR",
});

const RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y"]);
const INTERVALS = new Set(["1m", "5m", "15m", "30m", "1h", "1d"]);

const QUOTE_TTL = 60_000;       // 1 minute
const HISTORY_TTL = 300_000;    // 5 minutes
const SEARCH_TTL = 300_000;     // 5 minutes for search queries
const INDICES_TTL = 30_000;     // 30 seconds for live indices

// Bounded LRU Caches (Zero Unbounded Memory Leaks)
const quoteCache = new LRUCache({ max: 500, ttlMs: QUOTE_TTL });
const historyCache = new LRUCache({ max: 200, ttlMs: HISTORY_TTL });
const searchCache = new LRUCache({ max: 300, ttlMs: SEARCH_TTL });
const indicesCache = new LRUCache({ max: 10, ttlMs: INDICES_TTL });

// Shared In-Flight Map for single-flight deduplication
const inFlight = new Map();

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
};
