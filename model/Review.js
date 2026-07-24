const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({

    productId:String,

    name:String,

    email:String,

    rating:Number,
productName:String,
    review:String

});

module.exports = mongoose.model("review",reviewSchema);