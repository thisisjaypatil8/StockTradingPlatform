const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const authController = require("../controllers/auth");


// signup route
router.post("/signup",wrapAsync(authController.signup));

// login route
router.post("/login",wrapAsync(authController.login));

module.exports = router;