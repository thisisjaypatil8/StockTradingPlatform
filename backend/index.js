require("dotenv").config();
const express = require("express");

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const positionsRoutes = require("./routes/positions");
const holdingsRoutes = require("./routes/holdings");
const marketRoutes = require("./routes/market");
const fundsRoutes = require("./routes/funds");
const { startRmsScheduler } = require("./services/rmsScheduler");
const passport = require("passport");
const User = require("./model/UserModel");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const { errorHandler, sanitizeData } = require("./middleware");
const helmet = require("helmet");

const cors = require("cors");

const port = process.env.PORT;
const url = process.env.MONGO_URL;

const app = express();

//1. HTTP Security Headers
app.use(helmet());

//2. Strict CORS Whitelist(Only our frontend and dashboard)
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like Postman or mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS Blocked: Access denied for this origin!"));
        }
    },
    credentials: true, // Important for cookies and Authorization headers
}));
app.use(express.json());
app.use(sanitizeData); // Apply anti-injection filter globally

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

app.use("/funds", fundsRoutes);


app.use(errorHandler);

//DB-first server bootstrapping & lifecycle

let server;

//Connect to mongoDB first, then listen for traffic
mongoose.connect(url)
    .then(() =>{
        console.log("Connected to MongoDB successfully");

        // Start Autonomous RMS Schedular
        startRmsScheduler();

        server = app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.log(`MongoDB Connection Error: ${error}`);
        process.exit(1);
    });

    // Graceful shutdown(sigterm and sigint)
    function gracefulShutdown(signal){
        console.log(`\n${signal} received. Initiating clean shutdown...`);

        if(server){
            server.close(() => {
                console.log("HTTP server closed. In-flight requests drained.");

                mongoose.connection.close(false)
                    .then(() =>{
                        console.log("MongoDB connection closed cleanly. Process exiting.");
                        process.exit(0);
                    })
                    .catch((err) =>{
                        console.log("Error closing MongoDB connection:", err);
                        process.exit(1);
                    });
            }); 

            setTimeout(() =>{
                console.error("Graceful shutdown timed out! Forcefully terminating.");
                process.exit(1);
            }, 10000).unref(); // unref() allows the timeout to not block the process from exiting
        } else{
            process.exit(0); // If server never started, exit cleanly anyway
        }
    }

    // For linux/kubernetes
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    // For windows
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (err) => {
        console.error("UNHANDLED PROMISE REJECTION! 💥 Shutting down...", err);
        gracefulShutdown("unhandledRejection");
    });

    process.on("uncaughtException", (err) => {
        console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err);
        process.exit(1); // Critical Error
    });


