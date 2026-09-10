const { Schema } = require("mongoose");

const PositionsSchema = new Schema({
    product: {
        type: String,
        default: "MIS",
    },
    name: {
        type: String,
        required:true,
    },
    qty: {
        type:Number,
        default: 0,
    },
    netQty:{
        type:Number,
        default:0,
    },
    buyQty:{
        type: Number,
        default:0,
    },
    buyAvg:{
        type: Number,
        default:0,
    },
    sellQty:{
        type: Number,
        default:0,
    },
    sellAvg:{
        type: Number,
        default:0,
    },

    avg: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        default: 0,
    },
    realizedPnL:{
        type: Number, 
        default: 0,
    },
    net: {
        type: String,
        default: "+0.00%"
    },
    day: {
        type: String,
        default: "+0.00",
    },
    isLoss: {
        type: Boolean,
        default: false,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {timestamps: true}
);

module.exports = PositionsSchema;