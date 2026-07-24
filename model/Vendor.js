const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
    vendorName: String,
    sellerId: String,
    email: String,
    phone: String,
    address: String,
    image: String,

    grossSale:{
        type:Number,
        default:0
    },

    earning:{
        type:Number,
        default:0
    },

    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model("vendors", VendorSchema);