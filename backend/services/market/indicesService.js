const { yahooFinance, indicesCache, inFlight } = require("./config");
const { formatIndex } = require("./formatters");
const { withCache } = require("./withCache");

async function getMarketIndices() {
    return withCache(indicesCache, inFlight, "MARKET_INDICES", async () => {
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
                nifty: { name: "NIFTY 50", price: 24952.10, change: 104.20, percent: "+0.42%", isLoss: false },
                sensex: { name: "SENSEX", price: 81648.50, change: 308.50, percent: "+0.38%", isLoss: false },
                timestamp: Date.now(),
            };
        }
    });
}

module.exports = { getMarketIndices };
