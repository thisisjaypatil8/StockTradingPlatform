const express = require("express");
require("dotenv").config();
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

app.get("/health", (req, res) => {
    res.send("The app is alive! 🚀");
});


// app.get("/addHoldings", async (req, res) => {
//     let tempHoldings = [
//         {
//             name: "BHARTIARTL",
//             qty: 2,
//             avg: 538.05,
//             price: 541.15,
//             net: "+0.58%",
//             day: "+2.99%",
//             isLoss: false,
//         },
//         {
//             name: "HDFCBANK",
//             qty: 2,
//             avg: 1383.4,
//             price: 1522.35,
//             net: "+10.04%",
//             day: "+0.11%",
//             isLoss: false,
//         },
//         {
//             name: "HINDUNILVR",
//             qty: 1,
//             avg: 2335.85,
//             price: 2417.4,
//             net: "+3.49%",
//             day: "+0.21%",
//             isLoss: false,
//         },
//         {
//             name: "INFY",
//             qty: 1,
//             avg: 1350.5,
//             price: 1555.45,
//             net: "+15.18%",
//             day: "-1.60%",
//             isLoss: true,
//         },
//         {
//             name: "ITC",
//             qty: 5,
//             avg: 202.0,
//             price: 207.9,
//             net: "+2.92%",
//             day: "+0.80%",
//             isLoss: false,
//         },
//         {
//             name: "KPITTECH",
//             qty: 5,
//             avg: 250.3,
//             price: 266.45,
//             net: "+6.45%",
//             day: "+3.54%",
//             isLoss: false,
//         },
//         {
//             name: "M&M",
//             qty: 2,
//             avg: 809.9,
//             price: 779.8,
//             net: "-3.72%",
//             day: "-0.01%",
//             isLoss: true,
//         },
//         {
//             name: "RELIANCE",
//             qty: 1,
//             avg: 2193.7,
//             price: 2112.4,
//             net: "-3.71%",
//             day: "+1.44%",
//             isLoss: true,
//         },
//         {
//             name: "SBIN",
//             qty: 4,
//             avg: 324.35,
//             price: 430.2,
//             net: "+32.63%",
//             day: "-0.34%",
//             isLoss: true,
//         },
//         {
//             name: "SGBMAY29",
//             qty: 2,
//             avg: 4727.0,
//             price: 4719.0,
//             net: "-0.17%",
//             day: "+0.15%",
//             isLoss: true,
//         },
//         {
//             name: "TATAPOWER",
//             qty: 5,
//             avg: 104.2,
//             price: 124.15,
//             net: "+19.15%",
//             day: "-0.24%",
//             isLoss: true,
//         },
//         {
//             name: "TCS",
//             qty: 1,
//             avg: 3041.7,
//             price: 3194.8,
//             net: "+5.03%",
//             day: "-0.25%",
//             isLoss: true,
//         },
//         {
//             name: "WIPRO",
//             qty: 4,
//             avg: 489.3,
//             price: 577.75,
//             net: "+18.08%",
//             day: "+0.32%",
//             isLoss: false,
//         },
//     ]

//     tempHoldings.forEach(async(element) => {
//         let newHolding = new Holdings({
//             name: element.name,
//             qty: element.qty,
//             avg: element.avg,
//             price: element.price,
//             net: element.net,
//             day: element.day,
//             isLoss: element.isLoss,
//         });

//         await newHolding.save();
//     })
//     res.send("Holdings added successfully");
// })


// app.get("/addPositions", async (req, res) => {
//     let tempPositions = [
//         {
//     product: "CNC",
//     name: "EVEREADY",
//     qty: 2,
//     avg: 316.27,
//     price: 312.35,
//     net: "+0.58%",
//     day: "-1.24%",
//     isLoss: true,
//   },
//   {
//     product: "CNC",
//     name: "JUBLFOOD",
//     qty: 1,
//     avg: 3124.75,
//     price: 3082.65,
//     net: "+10.04%",
//     day: "-1.35%",
//     isLoss: true,
//   },
//     ]

//     tempPositions.forEach(async(element) => {
//         let newPosition = new Positions({
//             product: element.product,
//             name: element.name,
//             qty: element.qty,
//             avg: element.avg,
//             price: element.price,
//             net: element.net,
//             day: element.day,
//             isLoss: element.isLoss,
//         });

//         await newPosition.save();
//     })
//     res.send("Positions added successfully");
// })

app.post("/newOrder", async (req, res) => {
    try {
    const {name, qty, price, mode} = req.body;
    let newOrder = new Orders({
        name,
        qty,
        price,
        mode,
    });
    await newOrder.save();
    res.status(200).json({message: "Order Placed Successfully!!", order: newOrder});
} catch (err) {
    console.log(err);
    res.status(500).json({error: err.message});
}    
})



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    mongoose.connect(url)
        .then(() => console.log("Connected to MongoDB"))
        .catch((err) => console.log(err));
});