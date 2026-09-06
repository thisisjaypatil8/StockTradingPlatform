const { Schema } = require("mongoose");

const OrderSchema = new Schema({
    name:String,
    qty: Number,
    price:Number,
    mode:String,
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = OrderSchema;