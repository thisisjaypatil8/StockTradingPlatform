const {Schema} = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    // account
    email: {
        type: String,
        required:true,
        unique:true,
    },

    // funds
    funds:{
        availableCash:{
            type:Number,
            default:100000,
        },
        marginBlocked: {
            type: Number,
            default: 0,
        },
        totalDeposited: {
            type: Number,
            default:100000, //initial balance is the first deposit
        },
        totalWithdrawn: {
            type: Number,
            default: 0, //after first deposit 
        },
        lifetimeRealizedPnL: {
            type: Number,
            default: 0,
        },
    },

    // Authorization
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },

    // metadata
    createdAt:{
        type: Date,
        default: Date.now,
    },
});

UserSchema.plugin(
    // prevents "passport-local-mongoose is not a function" on CJS/ESM hybrids
    passportLocalMongoose.default || passportLocalMongoose
);

module.exports = UserSchema;