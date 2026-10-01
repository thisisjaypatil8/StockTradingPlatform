const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const ExpressError = require("./utils/ExpressError");
const { getISTDate } = require("./utils/time");

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
    const istDate = getISTDate();
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


// Idempotency Guard(Prevents accidental duplicate orders)
const idempotencyStore = new Map();

//Evict keys older than 2 min to prevent memory leaks
const IDEMPOTENCY_TTL = 1000 * 60 * 2; //2 min

module.exports.idempotencyGuard = (req, res, next) =>{
    //1. Check if client provided an idempotent key
    const key = req.headers["x-idempotency-key"];
    if(!key){
       //If not provided, continue normally (non-breaking)
       return next();
    }
    
    const cached = idempotencyStore.get(key);

    //2. If key exists and is still valid
    if(cached){
        if(Date.now() < cached.expiresAt){
            //Return cached response without touching DB or debiting funds!
            return res.status(cached.statusCode).json(cached.body);
        } else{
            //Old entry expired → delete
            idempotencyStore.delete(key);
        }
    }

    //3. Intercept res.json to capture the response for caching
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // cache response if everything is okay
        if(res.statusCode >= 200 && res.statusCode < 300){ 
            idempotencyStore.set(key, {
                statusCode: res.statusCode,
                body,
                expiresAt: Date.now() + IDEMPOTENCY_TTL
            });
        }
        // call original response sender
        return originalJson(body);
    };
    
    // pass response to next handler
    next();
};



//1. Database & library error transformers
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ExpressError(400, message);
};

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    const message = `Duplicate value '${value}' for field '${field}'. Please use another value!`
    return new ExpressError(409, message);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input: ${errors.join(". ")}`
    return new ExpressError(400, message);
};

const handleJWTError = () =>{
    return new ExpressError(401, "Invalid authentication token! Please log in again.");
};

const handleJWTExpiredError = () => {
    return new ExpressError(401, "Your session has expired! Please log in again.");
};

//2. Central Error Handling middleware
module.exports.errorHandler = (err, req, res, next) => {
    let error = err;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || "error";

    //Transform library-specific errors into standard ExpressError instances
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if(err.name === "JsonWebTokenError") error = handleJWTError(err);
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError(err);

    const isDev = process.env.NODE_ENV !== "production";
    
    // In Development: Full stack trace for rapid debugging
    if(isDev){
        return res.status(error.statusCode).json({
            success: false,
            status: error.status,
            error: error.message,
            stack: error.stack,
        });
    }

    // In Production
    if(error.isOperational){
        return res.status(error.statusCode).json({
            success: false,
            error: error.message
        })
    }

    // In Production: Unknown Programming bug, leak zero internals
    console.error("FATAL UNEXPECTED ERROR 💥", error);

    return res.status(500).json({
        success: false,
        message: "Something went wrong on our end. Please try again later."
    })
   
}

// Sanitizes keys starting with '$' or containing '.' to neutralize NoSQL injection
const cleanObject = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for(const key of Object.keys(obj)){
        if(key.startsWith("$") || key.includes(".")){
            delete obj[key]; //Strip dangerous operators
        } else if (typeof obj[key] === "object"){
            cleanObject(obj[key]); // recurse deeper for nested objects
        }
    }
};

module.exports.sanitizeData = (req, res, next) => {
    if(req.body) cleanObject(req.body);
    if(req.query) cleanObject(req.query);
    if(req.params) cleanObject(req.params);
    next();
};

// Rate limiter to prevent brute-force attacks on login/signup
module.exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 attempts
    standardHeaders: true, // Return rate limit info in X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
        success: false,
        error: "Too many attempts from this IP! Please wait 15 minutes before trying again."
    }
});


