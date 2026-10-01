const { yahooFinance, searchCache, inFlight } = require("./config");
const { withCache } = require("./withCache");

async function searchSymbols(query) {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
        return [];
    }

    const cleanQuery = query.trim();
    const cacheKey = `SEARCH_${cleanQuery.toUpperCase()}`;

    return withCache(searchCache, inFlight, cacheKey, async () => {
        try {
            const res = await yahooFinance.search(cleanQuery, { quotesCount: 20, newsCount: 0 });
            const quotes = res.quotes || [];

            // STRICT FILTER: Only NSE (.NS) and BSE (.BO) equities — No foreign stocks!
            return quotes
                .filter((q) => {
                    if (!q || !q.symbol || typeof q.symbol !== "string") return false;
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
        } catch (err) {
            console.warn(`[searchSymbols] Search Failed for '${query}':`, err.message);
            return [];
        }
    });
}

module.exports = { searchSymbols };
