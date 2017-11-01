let mongoose = require("mongoose");

// schema setup
let blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    content: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    created: {
        type: Date,
        default: Date.now()
   }
});

module.exports = mongoose.model("Blog", blogSchema);