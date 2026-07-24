const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = new Schema({

    userid: String,

    FirstName: String,

    LastName: String,

    AddressLine1: String,

    AddressLine2: String,

    City: String,

    Country: String,

    State: String,

    ZipCode: String,

    BusinessName: String,

    IsDefault: Boolean

});

const myaddress = mongoose.model("Address", addressSchema);

module.exports = myaddress;