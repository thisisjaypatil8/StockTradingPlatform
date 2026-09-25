const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const {isLoggedIn} = require("../middleware");
const positionController = require("../controllers/positions");

router.get("/", isLoggedIn,
    wrapAsync(positionController.getAllPositions)
);

router.post("/squareoffAll",isLoggedIn,
    wrapAsync(positionController.squareOffAllPositions)
);

module.exports = router;