const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    userId: String,
    customerName: String,

      email: String,

    phone: String,

    address: String,

    city: String,

    state: String,

    country: String,

    zipCode: String,


    productId: String,

    Title: String,

    image: String,

    Weight: String,

    SalePrice: Number,

    quantity: Number,

    orderNo: String,

    date: String,

    status: String

});

module.exports = mongoose.model("Order", orderSchema);