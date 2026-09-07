require("dotenv").config();
const express = require("express");

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const positionsRoutes = require("./routes/positions");
const holdingsRoutes = require("./routes/holdings");
const marketRoutes = require("./routes/market");

const passport = require("passport");
const User = require("./model/UserModel");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");

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


app.use("/market", marketRoutes);

app.use("/allHoldings", holdingsRoutes);

app.use("/allPositions", positionsRoutes);

app.use("/", ordersRoutes);

app.use("/", authRoutes);


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