const jwt = require("jsonwebtoken");
const ExpressError = require("./utils/ExpressError");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports.isLoggedIn = (req, res, next) => {
    // 1. First check if request header has any token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ExpressError(401, "Access denied! No token provided. Please log in first");
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Verify the token with secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;     // attaching user to request
        next();                 // Move to the next middleware / route handler
    } catch (error) {
        throw new ExpressError(401, "Session expired or invalid token! Please log in again.");
    }
};

module.exports.JWT_SECRET = JWT_SECRET;


module.exports.checkMarketHours = (req, res, next) => {
    const { product = "CNC", isSimulation } = req.body;

    //1. CNC (Delivery / AMO) orders market ke baad bhi allow hote hai 
    if (product !== "MIS") {
        return next();
    }

    //2. Admin simulation bypass (for testing)
    if (req.user && req.user.role === "admin" && isSimulation === true) {
        return next();
    }

    //3. Indian Standard Time (IST) 
    const now = new Date();
    const isString = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
    });
    const istDate = new Date(isString);
    const day = istDate.getDay();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const MARKET_OPEN = 9 * 60 + 15;
    const MARKET_CLOSE = 15 * 60 + 30; // 03:30 PM = 930 mins
    const isWeekend = (day === 0 || day === 6);
    const isWithinTradingHours = (currentMinutes >= MARKET_OPEN && currentMinutes <= MARKET_CLOSE);
    // 4. Agar weekend hai ya time 9:15 - 15:30 ke bahar hai, toh bouncer rokk dega!
    if (isWeekend || !isWithinTradingHours) {
        throw new ExpressError(
            403,
            "Market is closed for Intraday (MIS) orders! Regular market hours are Mon-Fri, 09:15 AM to 03:30 PM IST. Place CNC for delivery."
        );
    }
    next();
}

module.exports.validateOrderInput = (req, res, next) => {
    const { name, qty, price, mode, product = "CNC" } = req.body;
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        throw new ExpressError(400, "Valid stock symbol name is required!");
    }

    if (!Number.isFinite(orderQty) || !Number.isInteger(orderQty) || orderQty <= 0) {
        throw new ExpressError(400, "Quantity must be a positive whole number!");
    }

    if (!Number.isFinite(orderPrice) || orderPrice <= 0) {
        throw new ExpressError(400, "Price must be a valid positive number!");
    }

    if (!["BUY", "SELL"].includes(mode)) {
        throw new ExpressError(400, "Invalid mode! Must be BUY or SELL.");
    }

    if (!["CNC", "MIS"].includes(product)) {
        throw new ExpressError(400, "Invalid product! Must be CNC or MIS.");
    }

    req.body.name = name.trim().toUpperCase();
    req.body.qty = orderQty;
    req.body.price = orderPrice;
    req.body.product = product;

    next();
};
