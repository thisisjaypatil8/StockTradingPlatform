const { Schema, model } = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    funds: {
        availableCash: {
            type: Number,
            default: 100000
        },
        marginBlocked: {
            type: Number,
            default: 0
        },
        totalDeposited: {
            type: Number,
            default: 100000
        },
        totalWithdrawn: {
            type: Number,
            default: 0
        },
        lifetimeRealizedPnL: {
            type: Number,
            default: 0
        },
    },
    role: {
        type: String,
        default: "user"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

UserSchema.plugin(passportLocalMongoose.default || passportLocalMongoose);

module.exports = model("User", UserSchema);
