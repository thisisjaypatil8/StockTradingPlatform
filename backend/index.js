const express = require("express");
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

// signup Route
app.post("/signup", async (req, res) => {
    try {
        const {username, email, password } =req.body;

        if(!username || !email || !password){
            return res.status(400).json({error:"All fields required"});
        }

        const newUser = new User({ email, username });

        // user.register() password ko mongo me save krenge
        const registeredUser = await User.register(newUser, password);

        res.status(200).json({
            success: true,
            message:"User registered successfully!",
            user:{
                username: registeredUser.username,
                email: registeredUser.email
            },
        });
        
    } catch (err) {
        console.error("Signup Error: ", err);
        res.status(400).json({ error: err.message });
    }
});

// Login Route
app.post("/login", (req, res, next) =>{
    passport.authenticate("local",(err, user, info) =>{
        if(err){
            return res.status(500).json({error: err.message});
        }
        if(!user){
            // agar password galat hai ya user nahi mila
            return res.status(401).json({error: info?.message || "Invalid username or password!"});
        }

        res.status(200).json({
            success: true,
            message: "Login successful!",
            user: {
                username: user.username,
                email:user.email
            },
        });
    })(req, res, next);
});


app.get("/allHoldings", async(req, res) =>{
    try{
        const allHoldings = await Holdings.find({});
        res.status(200).json(allHoldings);
    }catch(err){
        res.status(500).json({ error: "Failed to fetch holdings: " + err.message });    
    }
})


app.get("/allOrders", async (req, res) => {
    try {
        const allOrders = await Orders.find({}).sort({_id:-1});
        res.status(200).json(allOrders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders: " + error.message });    
    }
    
});




app.post("/newOrder", async (req, res) => {
    try {
    const {name, qty, price, mode} = req.body;
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    if(!name || orderQty <= 0 || orderPrice <= 0){
        return res.status(400).json({error: "Invalid stock name, quantity, or price!"})
    }

    let newOrder = new Orders({
        name,
        qty: orderQty,
        price: orderPrice,
        mode,    // BUY ya SELL
    });
    await newOrder.save();

    const existingHolding = await Holdings.findOne({name});

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
            // first time Buy ho rha - naya holding create kro
            const newHolding = new Holdings({
                name,
                qty:orderQty,
                avg:orderPrice,
                price:orderPrice,
                net:"+0.00%",
                day:"+0.00%",
                isLoss:false,
            });

            await newHolding.save();
        }
    }else if(mode === "SELL"){
        if(!existingHolding || existingHolding.qty < orderQty){
            return res.status(400).json({
                error: `Insufficient holdings! You only own ${existingHolding ? existingHolding.qty : 0} shares of ${name}.`
            })
        }
        if(existingHolding.qty === orderQty){
            await Holdings.deleteOne({ name });
        }else{
            existingHolding.qty -= orderQty;
            existingHolding.price = orderPrice;
            await existingHolding.save();
        }
    }


    res.status(200).json({message: `${mode} order executed & holdings updated successfuly!`, order: newOrder});
} catch (err) {
    console.error("order Execution Error:", err);
    res.status(500).json({error: err.message});
}    
})



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    mongoose.connect(url)
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => console.log(err));
});