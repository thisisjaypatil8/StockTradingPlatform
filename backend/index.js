const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, isLoggedIn } = require("./middleware");
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/wrapAsync");
require("dotenv").config();
const passport = require("passport");
const User = require("./model/UserModel");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Holdings = require("./model/HoldingsModel");
const Positions = require("./model/PositionsModel");
const Orders = require("./model/OrdersModel");
const cors = require("cors");

const port = process.env.PORT;
const url = process.env.MONGO_URL;

const app = express();
app.use(cors());
app.use(express.json());

app.use(passport.initialize());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/health", (req, res) => {
    res.send("The app is alive! 🚀");
}); 

// Yahoo finance Live market Quote Proxy
app.get("/market/quote/:symbol", async (req, res) => {
    try {
        const { symbol } = req.params;   // INFY or Reliance

        const yahooSymbol = symbol.includes(".") ? symbol : `${symbol.toUpperCase()}.NS`;

        // yahoo finance fetch call
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=5m`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Yahoo Finance error: ${response.statusText}` });
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result) {
            return res.status(404).json({ error: `Stock symbol '${symbol}' not found on Yahoo Finance!` });
        }

        // extract needed values from meta
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;

        const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;

        // How much changed?
        const change = currentPrice - previousClose;
        const percentChange = previousClose ? ((change / previousClose) * 100).toFixed(2) : "0.00";

        // 5. for frontend Clean formatted response
        res.status(200).json({
            symbol: meta.symbol,
            name: symbol.toUpperCase(),
            price: Number(currentPrice.toFixed(2)),
            previousClose: Number(previousClose.toFixed(2)),
            change: Number(change.toFixed(2)),
            percent: `${change >= 0 ? "+" : ""}${percentChange}%`,
            isLoss: change < 0,
            currency: meta.currency || "INR",
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch market quote: " + err.message });
    }
});


// signup Route
app.post("/signup", wrapAsync(async (req, res) => {
   
        const {username, email, password } =req.body;

        if(!username || !email || !password){
            return res.status(400).json({error:"All fields required"});
        }

        const newUser = new User({ email, username });
        // user.register() password ko mongo me save krenge
        const registeredUser = await User.register(newUser, password);

        // Generate JWT token
        const token = jwt.sign(
            { id: registeredUser._id, username:registeredUser.username, email:registeredUser.email },
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
                email: registeredUser.email
            },
        });
}));

// Login Route
app.post("/login", (req, res, next) =>{
    passport.authenticate("local",(err, user, info) =>{
        if(err) return next(err);
        if(!user){
            // if (wrong username or password)
            return res.status(401).json({error: info?.message || "Invalid username or password!"});
        }
        // Generate JWT Token
        const token = jwt.sign(
            {id: user._id, username: user.username, email: user.email},
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
            },
        });
    })(req, res, next);
});


app.get("/allHoldings", 
    isLoggedIn,
    wrapAsync(async(req, res) =>{
        // only Loggedin user's data will send to client
        const allHoldings = await Holdings.find({user:req.user.id});
        res.status(200).json(allHoldings);
}));

app.get("/allPositions",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const allPositions = await Positions.find({user: req.user.id});
        res.status(200).json(allPositions);
}));

app.get("/allOrders", 
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const allOrders = await Orders.find({user: req.user.id}).sort({_id:-1});
        res.status(200).json(allOrders);
}));

app.post("/newOrder", 
    isLoggedIn,
    wrapAsync(async (req, res) => {
    const {name, qty, price, mode} = req.body;
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    if(!name || orderQty <= 0 || orderPrice <= 0){
       throw new ExpressError(400, "Invalid stock name, quantity, or price!")
    }

    // 1. attach user id in order document
    let newOrder = new Orders({
        name,
        qty: orderQty,
        price: orderPrice,
        mode,    // BUY ya SELL
        user: req.user.id,
    });
    await newOrder.save();

    // 2. Only check holdings of LOGGED IN USER
    const existingHolding = await Holdings.findOne({name, user: req.user.id});

    if(mode === "BUY"){
        if(existingHolding){
            const totalCost = (existingHolding.qty * existingHolding.avg) +
            (orderQty * orderPrice);
            const totalQty = existingHolding.qty + orderQty;
            const newAvg = totalCost/totalQty;

            existingHolding.qty = totalQty;
            existingHolding.avg = Number(newAvg.toFixed(2));
            existingHolding.price = orderPrice; // Latest market price Update

            await existingHolding.save();
        }else{
            // first time buy - new Holding with user reference
            const newHolding = new Holdings({
                name,
                qty:orderQty,
                avg:orderPrice,
                price:orderPrice,
                net:"+0.00%",
                day:"+0.00%",
                isLoss:false,
                user: req.user.id,    // owner attached
            });

            await newHolding.save();
        }
    }else if(mode === "SELL"){
        if(!existingHolding || existingHolding.qty < orderQty){
            throw new ExpressError(400,`Insufficient holdings! You only own ${existingHolding ? existingHolding.qty : 0} shares of ${name}.`)
        }
        if(existingHolding.qty === orderQty){
            await Holdings.deleteOne({ _id: existingHolding._id });
        }else{
            existingHolding.qty -= orderQty;
            existingHolding.price = orderPrice;
            await existingHolding.save();
        }
    }

    res.status(200).json({
        success: true,
        message: `${mode} order executed & holdings updated successfuly!`,
        order: newOrder
    });
}));

// Central Error Handling Middleware
app.use((err, req, res, next) =>{
    const { statusCode = 500, message = "Something went wrong!"} = err;
    console.error("Backend Error Caught:", err);
    res.status(statusCode).json({ success:false, error: message});
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    mongoose.connect(url)
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => console.log(err));
});