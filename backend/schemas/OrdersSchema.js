const { Schema } = require("mongoose");

const OrderSchema = new Schema({
    name:String,
    qty: Number,
    price:Number,
    mode:String,
    product:{
        type:String,
        enum:["CNC", "MIS"],
        default: "CNC",
    },
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