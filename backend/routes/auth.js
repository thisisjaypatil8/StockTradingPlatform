const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const authController = require("../controllers/auth");
const { authLimiter } = require("../middleware");



// signup route
router.post("/signup",authLimiter, wrapAsync(authController.signup));

// login route
router.post("/login",authLimiter, wrapAsync(authController.login));

module.exports = router;