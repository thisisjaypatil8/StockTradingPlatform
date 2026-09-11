// backend/routes/funds.js
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const fundsController = require("../controllers/funds");

router.get("/", isLoggedIn, wrapAsync(fundsController.getFunds));
router.post("/add", isLoggedIn, wrapAsync(fundsController.addFunds));
router.post("/withdraw", isLoggedIn, wrapAsync(fundsController.withdrawFunds));

module.exports = router;
