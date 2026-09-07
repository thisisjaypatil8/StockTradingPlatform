const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const holdingsController = require("../controllers/holdings");


// Route: /allHoldings
router.get("/", isLoggedIn, wrapAsync(holdingsController.getAllHoldings));

module.exports = router;