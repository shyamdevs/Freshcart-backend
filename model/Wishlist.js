const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "addproducts"
    },
    Title: String,
    Category: String,
    Weight: String,
    image: String,
    SalePrice: Number,
    RegularPrice: Number,
    status: String,
     email:String
});

module.exports = mongoose.model("wishlist", WishlistSchema);