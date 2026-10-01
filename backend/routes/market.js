const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const marketController = require("../controllers/market");


// Route: /market/indices (Live Nifty & Sensex)
router.get("/indices", wrapAsync(marketController.getIndices));

// Route: /market/quotes?symbols=A,B,C (Batch fetch)
router.get("/quotes", wrapAsync(marketController.getBatchQuotes));

// Route: /market/search?q=reliance
router.get("/search", wrapAsync(marketController.searchStocks));

// Route: /market/quote/:symbol
router.get("/quote/:symbol", wrapAsync(marketController.getQuote));

// Route: /market/quote/:symbol/chart 
router.get("/history/:symbol", wrapAsync(marketController.getHistory));

module.exports = router;