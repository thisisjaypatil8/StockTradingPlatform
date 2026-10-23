const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, checkMarketHours, validateOrderInput } = require("../middleware");
const ordersController = require("../controllers/orders");

router.get("/allOrders",
    isLoggedIn,
    wrapAsync(ordersController.getAllOrders)
);

router.post("/newOrder",
    isLoggedIn,
    checkMarketHours,
    validateOrderInput,
    wrapAsync(ordersController.createOrder)
);

module.exports = router;