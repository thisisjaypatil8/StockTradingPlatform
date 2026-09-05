const {Schema} = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required:true,
        unique:true,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
});

UserSchema.plugin(passportLocalMongoose.default || passportLocalMongoose);

module.exports = UserSchema;