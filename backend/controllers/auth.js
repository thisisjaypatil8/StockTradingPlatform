const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");
const { JWT_SECRET} = require("../middleware");


const checkIsAdminIdentifier = (username = "", email = "") => {
    const adminUser = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const u = (username || "").trim().toLowerCase();
    const e = (email || "").trim().toLowerCase();
    return Boolean((adminUser && u === adminUser) || (adminEmail && e === adminEmail));
};

// signup Route
module.exports.signup = async (req, res) => {
   
        const {username, email, password } =req.body;

        if(!username || !email || !password){
            throw new ExpressError(400, "All fields are required");
        }

        const assignRole = checkIsAdminIdentifier(username, email) ? "admin" : "user";

        const newUser = new User({ email, username, role:assignRole });
        // user.register() password ko mongo me save krenge
        const registeredUser = await User.register(newUser, password);

        // Generate JWT token
        const token = jwt.sign(
            { id: registeredUser._id, username:registeredUser.username, email:registeredUser.email, role:registeredUser.role },
            JWT_SECRET,
            { expiresIn:"7d" }
        );

        res.status(200).json({
            success: true,
            message:"User registered successfully!",
            token,
            user:{
                id: registeredUser._id,
                username: registeredUser.username,
                email: registeredUser.email,
                role: registeredUser.role,
            },
        });
};

// Login Route
module.exports.login = (req, res, next) =>{
    passport.authenticate("local",(err, user, info) =>{
        if(err) return next(err);
        if(!user){
            // if (wrong username or password)
            return res.status(401).json({error: info?.message || "Invalid username or password!"});
        }

        const isAdmin = checkIsAdminIdentifier(user.username, user.email);
        const userRole = (user.role === "admin" && isAdmin) ? "admin" : "user";
        
        // Generate JWT Token
        const token = jwt.sign(
            {id: user._id, username: user.username, email: user.email, role:userRole},
            JWT_SECRET,
            { expiresIn: "7d"}
        );

        res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                username: user.username,
                email:user.email,
                role: userRole
            },
        });
    })(req, res, next);
};