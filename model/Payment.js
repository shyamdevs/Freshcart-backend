const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    userId: String,

    cardType: String,

    cardName: String,

    cardNumber: String,

    month: String,

    year: String,

    cvv: String

});

module.exports = mongoose.model("payment", paymentSchema);