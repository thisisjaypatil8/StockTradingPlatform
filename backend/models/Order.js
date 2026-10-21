const { Schema, model } = require("mongoose");

const OrderSchema = new Schema({
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    mode: { type: String, enum: ["BUY", "SELL"], required: true },
    product: {
        type: String,
        enum: ["CNC", "MIS"],
        default: "CNC",
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = model("Orders", OrderSchema);
