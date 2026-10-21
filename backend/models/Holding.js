const { Schema, model } = require("mongoose");

const HoldingsSchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    qty: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    avg: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    price: { 
        type: Number, 
        default: 0 
    },
    net: { 
        type: String, 
        default: "+0.00%" 
    },
    day: { 
        type: String, 
        default: "+0.00%" 
    },
    isLoss: { 
        type: Boolean, 
        default: false 
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
});

// Compound unique index: one holding record per stock per user
HoldingsSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = model("Holdings", HoldingsSchema);
