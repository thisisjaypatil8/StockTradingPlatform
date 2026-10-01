const marketService = require("../services/marketService");

// Live Market Indices Controller (Nifty 50 & Sensex)
module.exports.getIndices = async (req, res) => {
    const indices = await marketService.getMarketIndices();
    return res.status(200).json(indices);
};

// Single Quote
module.exports.getQuote = async (req, res) => {
    const { symbol } = req.params;
    const data = await marketService.getSingleQuote(symbol);
    return res.json(data);
};

// Batch Quotes (Throttled via Service)
module.exports.getBatchQuotes = async (req, res) => {
    const rawSymbols = req.query.symbols;
    if (!rawSymbols) {
        return res.status(200).json({});
    }

    const symbols = rawSymbols.split(",").map((s) => s.trim()).filter(Boolean);
    const quotes = await marketService.getBatchQuotes(symbols);
    return res.status(200).json(quotes);
};

// Historical Chart
module.exports.getHistory = async (req, res) => {
    const { symbol } = req.params;
    const range = req.query.range || "1d";
    const interval = req.query.interval || "5m";

    const data = await marketService.getHistory(symbol, range, interval);
    return res.json(data);
};

// Re-export for internal controllers like positions.js
module.exports.getCurrentStockPrice = marketService.getCurrentStockPrice;

// Live Search Controller 
module.exports.searchStocks = async (req, res) => {
    const query = req.query.q;
    const results = await marketService.searchSymbols(query);
    return res.status(200).json(results);
}
