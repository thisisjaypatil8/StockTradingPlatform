const ExpressError = require("../utils/ExpressError");

const TICKER_ALIASES = {
    HUL: "HINDUNILVR",
};

const resolveSymbol = (sym) => {
    const upper = sym.toUpperCase();
    const resolved = TICKER_ALIASES[upper] || upper;
    return resolved.includes(".") ? resolved : `${resolved}.NS`;
}

// Simple In-Memory TTL Cache for 1 Minute
const quoteCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute freshness

// Graph / Chart data TTL Cache of 5 minutes
const historyCache = new Map();
const HISTORY_CACHE_TTL_MS = 4 * 60 * 1000; // 5 minutes freshness


// Yahoo finance Live market Quote Proxy
module.exports.getQuote = async (req, res) => {
    const { symbol } = req.params;   // INFY or Reliance
    const yahooSymbol = resolveSymbol(symbol);

    // yahoo finance fetch call
    const cached = quoteCache.get(yahooSymbol);
    if(cached && Date.now() < cached.expiry){
        //Cache hit! Zero external API calls!
        return res.status(200).json(cached.data);
    }
    //2. Cache miss or expired - Fetch from Yahoo finance
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=5m`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
        return res.status(response.status).json({ error: `Yahoo Finance error: ${response.statusText}` });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
        return res.status(404).json({ error: `Stock symbol '${symbol}' not found on Yahoo Finance!` });
    }

    // extract needed values from meta
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;

    const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;

    // How much changed?
    const change = currentPrice - previousClose;
    const percentChange = previousClose ? ((change / previousClose) * 100).toFixed(2) : "0.00";

    // 5. for frontend Clean formatted response
    const formattedResponse = {
        symbol: meta.symbol,
        name: symbol.toUpperCase(),
        price: Number(currentPrice.toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        change: Number(change.toFixed(2)),
        percent: `${change >= 0 ? "+" : ""}${percentChange}%`,
        isLoss: change < 0,
        currency: meta.currency || "INR",
    };

    //3. Save into cache with 1 min expiry
    quoteCache.set(yahooSymbol, {
        data: formattedResponse,
        expiry: Date.now() + CACHE_TTL_MS,
    });

    res.status(200).json(formattedResponse);

};

// Yahoo Finance Stock Historical Fluctuation data
module.exports.getHistory = async (req, res) => {

    const { symbol } = req.params;
    const range = req.query.range || "1d";
    const interval = req.query.interval || "5m";

    const yahooSymbol = resolveSymbol(symbol);
    const cacheKey = `${yahooSymbol}_${range}_${interval}`;
    
    //1. Check Cache History
    const cached = historyCache.get(cacheKey);
    if(cached && Date.now() < cached.expiry){
        return res.status(200).json(cached.data);
    }

    //2. Cache miss - Fetch from Yahoo
    const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`,
        {
            headers: { "User-Agent": "Mozilla/5.0" }
        }
    );

    if (!response.ok) {
        return res.status(response.status).json({ error: `Yahoo Finance error: ${response.statusText}` });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
        return res.status(404).json({ error: `No historical chart data found for ${symbol}` });
    }

    // Extract Price data
    const timestamps = result.timestamp;
    const closePrices = result.indicators.quote[0].close;

    //Timestamps to readable dates
    const formattedLabels = [];
    const formattedPrices = [];

    // iterate over all timestamps and prices
    for (let i = 0; i < timestamps.length; i++) {
        const price = closePrices[i];

        // Filter out null/undefined prices
        if (price !== null && price !== undefined) {
            const date = new Date(timestamps[i] * 1000);
            const timeStr = date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            formattedLabels.push(timeStr);
            formattedPrices.push(Number(price.toFixed(2)));
        }
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;

    const historyData = {
        symbol: meta.symbol,
        name: symbol.toUpperCase(),
        currentPrice: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        isLoss: change < 0,
        labels: formattedLabels,
        prices: formattedPrices,
    };

    // Save into history cache
    historyCache.set(cacheKey, {
        data: historyData, 
        expiry: Date.now() + HISTORY_CACHE_TTL_MS
    });

    return res.status(200).json(historyData);

};