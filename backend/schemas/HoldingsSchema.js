const { Schema } = require("mongoose");

const holdingsSchema = new Schema({
    name: String,
    qty: Number,
    avg: Number,
    price: Number,
    net: String,
    day: String,
    isLoss: Boolean,
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    
});

module.exports = holdingsSchema;