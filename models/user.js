let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: "https://i.imgur.com/zRXpnb5.png"
    },
    firstName: {
        type: String,
        default: ""
    },
    lastName: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    bio: {
        type: String,
        default: ""
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);