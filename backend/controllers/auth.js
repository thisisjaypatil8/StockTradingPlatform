const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { User } = require("../models");
const ExpressError = require("../utils/ExpressError");
const { JWT_SECRET } = require("../middleware");

// In-memory single-use 30-second auth code store.
// Sufficient for a single-instance deployment. For multi-instance or
// zero-downtime deployments, replace with Redis: SET authcode:<code> <JSON> EX 30
// and exchange atomically with GETDEL.
const authCodes = new Map();

function generateAuthCode(user) {
    const code = crypto.randomBytes(24).toString("hex");
    authCodes.set(code, {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
        expiresAt: Date.now() + 30000 // 30 seconds TTL
    });
    // Auto purge on expiry
    setTimeout(() => authCodes.delete(code), 30000);
    return code;
}

// signup Route
module.exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ExpressError(400, "All fields are required");
    }

    const newUser = new User({ email, username, role: "user" });

    const registeredUser = await User.register(newUser, password);

    // Issue a JWT for the landing portal's own session (stored in localStorage).
    const token = jwt.sign(
        { id: registeredUser._id, username: registeredUser.username, email: registeredUser.email, role: registeredUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    // Issue a separate single-use auth code for the cross-origin dashboard handoff.
    // The dashboard exchanges this code server-side via POST /exchange-code and
    // receives its own JWT — the bearer token never appears in any URL.
    const authCode = generateAuthCode(registeredUser);

    res.status(200).json({
        success: true,
        message: "User registered successfully!",
        token,
        authCode,
        user: {
            id: registeredUser._id,
            username: registeredUser.username,
            email: registeredUser.email,
            role: registeredUser.role,
        },
    });
};

// Login Route
module.exports.login = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ error: info?.message || "Invalid username or password!" });
        }

        const userRole = user.role || "user";

        // Issue a JWT for the landing portal's own session (stored in localStorage).
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: userRole },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Issue a single-use auth code for the cross-origin dashboard handoff.
        const authCode = generateAuthCode(user);

        res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            authCode,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: userRole
            },
        });
    })(req, res, next);
};

// Exchange single-use auth code for session token (zero token in URL)
module.exports.exchangeCode = async (req, res) => {
    const { code } = req.body;

    if (!code || !authCodes.has(code)) {
        throw new ExpressError(400, "Invalid or expired authorization code");
    }

    const payload = authCodes.get(code);
    authCodes.delete(code); // Burn code immediately (single-use / replay protection)

    if (Date.now() > payload.expiresAt) {
        throw new ExpressError(400, "Authorization code has expired");
    }

    const token = jwt.sign(
        { id: payload.userId, username: payload.username, email: payload.email, role: payload.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.status(200).json({
        success: true,
        token,
        user: {
            id: payload.userId,
            username: payload.username,
            email: payload.email,
            role: payload.role
        }
    });
};
