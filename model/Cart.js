const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({

    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"addproducts"
    },

    Title:String,

    Category:String,

    image:String,

    Weight:String,

    SalePrice:Number,

    RegularPrice:Number,

    quantity:{
        type:Number,
        default:1
    }

});

module.exports = mongoose.model("cart",CartSchema);