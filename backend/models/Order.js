const { Schema, model } = require("mongoose");

const OrderSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    mode: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true
    },
    product: {
        type: String,
        enum: ["CNC", "MIS"],
        default: "CNC",
    },
    idempotencyKey: {
        type: String,
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

// Compound Indexes
OrderSchema.index({
    user: 1,
    idempotencyKey: 1
}, {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } }
});

OrderSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = model("Orders", OrderSchema);
