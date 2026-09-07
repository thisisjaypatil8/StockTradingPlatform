const Orders = require("../model/OrdersModel");
const Holdings = require("../model/HoldingsModel");
const ExpressError = require("../utils/ExpressError");

module.exports.getAllOrders = async (req, res) => {
        const allOrders = await Orders.find({user: req.user.id}).sort({_id:-1});
        res.status(200).json(allOrders);
};

module.exports.createOrder = async (req, res) => {
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
};

