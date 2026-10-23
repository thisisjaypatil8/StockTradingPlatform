const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const marketController = require("../controllers/market");


router.get("/indices", wrapAsync(marketController.getIndices));
router.get("/quotes", wrapAsync(marketController.getBatchQuotes));
router.get("/search", wrapAsync(marketController.searchStocks));
router.get("/quote/:symbol", wrapAsync(marketController.getQuote));
router.get("/history/:symbol", wrapAsync(marketController.getHistory));

module.exports = router;