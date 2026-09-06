const jwt = require("jsonwebtoken");
const ExpressError = require("./utils/ExpressError");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports.isLoggedIn = (req, res, next) => {
    // 1. First check if request header has any token
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
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

