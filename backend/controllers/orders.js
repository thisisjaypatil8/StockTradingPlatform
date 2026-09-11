const Orders = require("../model/OrdersModel");
const Holdings = require("../model/HoldingsModel");
const Positions = require("../model/PositionsModel");
const User = require("../model/UserModel");
const ExpressError = require("../utils/ExpressError");

module.exports.getAllOrders = async (req, res) => {
    const allOrders = await Orders.find({ user: req.user.id }).sort({ _id: -1 });
    res.status(200).json(allOrders);
};

module.exports.createOrder = async (req, res) => {
    const { name, qty, price, mode, product = "CNC" } = req.body;
    const orderQty = Number(qty);
    const orderPrice = Number(price);

    if (!name || orderQty <= 0 || orderPrice <= 0) {
        throw new ExpressError(400, "Invalid stock name, quantity, or price!")
    }

    // 1. attach user id in order document
    let newOrder = new Orders({
        name,
        qty: orderQty,
        price: orderPrice,
        mode,    // BUY ya SELL
        user: req.user.id,
        product,
    });
    await newOrder.save();

    if (product === "CNC") {
        const existingHolding = await Holdings.findOne({ name, user: req.user.id });
        if (mode === "BUY") {
                const orderCost = orderQty * orderPrice;

                //1. balance precheck
                const user = await User.findById(req.user.id);
                const currentCash = user.funds?.availableCash !== undefined ? user.funds.availableCash : 100000;

                if(currentCash < orderCost){
                    throw new ExpressError(400, `Insufficient funds! Required ₹${orderCost.toLocaleString("en-IN")} but only have ₹${currentCash.toLocaleString("en-IN")}`);
                }

                //2. Atomic cash deduction
                await User.findByIdAndUpdate(req.user.id, {
                    $inc:{"funds.availableCash": -orderCost}
                });

                //3. Existing holdings update
                if(existingHolding){
                    const totalCostCalc = (existingHolding.qty * existingHolding.avg) + (orderQty * orderPrice);
                     const totalQty = existingHolding.qty + orderQty;
                const newAvg = totalCostCalc / totalQty;

                existingHolding.qty = totalQty;
                existingHolding.avg = Number(newAvg.toFixed(2));
                existingHolding.price = orderPrice; // Latest market price Update

                await existingHolding.save();
                
                
               
            } else {
                // first time buy - new Holding with user reference
                const newHolding = new Holdings({
                    name,
                    qty: orderQty,
                    avg: orderPrice,
                    price: orderPrice,
                    net: "+0.00%",
                    day: "+0.00%",
                    isLoss: false,
                    user: req.user.id,    // owner attached
                });

                await newHolding.save();
            }
        } else if (mode === "SELL") {
            if (!existingHolding || existingHolding.qty < orderQty) {
                throw new ExpressError(400, `Insufficient holdings! You only own ${existingHolding ? existingHolding.qty : 0} shares of ${name}.`)
            }

            // 1. Credit sale proceeds back to user wallet!
            const sellProceeds = orderQty * orderPrice;
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { "funds.availableCash": sellProceeds}
            })

            //2. Reduce holding / delete holding

            if (existingHolding.qty === orderQty) {
                await Holdings.deleteOne({ _id: existingHolding._id });
            } else {
                existingHolding.qty -= orderQty;
                existingHolding.price = orderPrice;
                await existingHolding.save();
            }
        }
    } else {
        // MIS product
        let existingPosition = await Positions.findOne({ name, user: req.user.id, product: "MIS" });

        if (!existingPosition) {
            const isBuy = mode === "BUY";

            existingPosition = new Positions({
                name,
                product: "MIS",
                user: req.user.id,
                qty: isBuy ? orderQty : -orderQty,
                netQty: isBuy ? orderQty : -orderQty,
                buyQty: isBuy ? orderQty : 0,
                buyAvg: isBuy ? orderPrice : 0,
                sellQty: isBuy ? 0 : orderQty,
                sellAvg: isBuy ? 0 : orderPrice,
                avg: orderPrice,
                price: orderPrice,
                realizedPnL: 0,
                net: "+0.00%",
                day: "+0.00%",
                isLoss: false,
            });
            await existingPosition.save();
        } else {
            // Position exists - calculate long, short, averaging & Realized P&L
            const prevNetQty = existingPosition.netQty !== undefined ? existingPosition.netQty : existingPosition.qty;
            let realizedDiff = 0;
            if (mode === "BUY") {
                // If previously Short, buying is covering the short
                if (prevNetQty < 0) {
                    const shortCoverQty = Math.min(orderQty, Math.abs(prevNetQty));
                    realizedDiff += (existingPosition.sellAvg - orderPrice) * shortCoverQty;
                }

                // Update cumulative buy  volume & weighted buy average
                const prevBuyTotal = (existingPosition.buyQty || 0) * (existingPosition.buyAvg || 0);
                const newBuyTotal = prevBuyTotal + (orderQty * orderPrice);
                const newBuyQty = (existingPosition.buyQty || 0) + orderQty;

                existingPosition.buyQty = newBuyQty;
                existingPosition.buyAvg = Number((newBuyTotal / newBuyQty).toFixed(2));
            } else if (mode === "SELL") {
                // if previously Long, selling is squaring off the long
                if (prevNetQty > 0) {
                    const longExitQty = Math.min(orderQty, prevNetQty);
                    realizedDiff += (orderPrice - existingPosition.buyAvg) * longExitQty;
                }

                // Update cumulative sell volume & weighted sell average
                const prevSellTotal = (existingPosition.sellQty || 0) * (existingPosition.sellAvg || 0);
                const newSellTotal = prevSellTotal + (orderQty * orderPrice);
                const newSellQty = (existingPosition.sellQty || 0) + orderQty;

                existingPosition.sellAvg = Number((newSellTotal / newSellQty).toFixed(2));
                existingPosition.sellQty = newSellQty;
            }

            // Lock in realized profit/loss
            existingPosition.realizedPnL = Number(((existingPosition.realizedPnL || 0) + realizedDiff).toFixed(2));

            // T+0 Instant settlement: settle realized P&L directly into cash wallet!
            if(realizedDiff !== 0){
                await User.findByIdAndUpdate(req.user.id, {
                    $inc: {"funds.availableCash": Number(realizedDiff.toFixed(2))}
                });
            }

            //Calculate new Net Quantity
            const newNetQty = existingPosition.buyQty - existingPosition.sellQty;
            existingPosition.netQty = newNetQty;
            existingPosition.qty = newNetQty;

            // Effective const price: long = buyAvg, Short = sellAvg
            if (newNetQty > 0) {
                existingPosition.avg = existingPosition.buyAvg;
            } else if (newNetQty < 0) {
                existingPosition.avg = existingPosition.sellAvg;
            } else {
                existingPosition.avg = existingPosition.buyAvg || existingPosition.sellAvg || orderPrice;
            }

            existingPosition.price = orderPrice;
            await existingPosition.save();
        }
    }
    res.status(200).json({
        success: true,
        message: `${mode} order executed & holdings updated successfuly!`,
        order: newOrder
    });
}



