const {Schema} = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required:true,
        unique:true,
    },
    funds:{
        availableCash:{
            type:Number,
            default:100000,
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
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
});

UserSchema.plugin(passportLocalMongoose.default || passportLocalMongoose);

module.exports = UserSchema;