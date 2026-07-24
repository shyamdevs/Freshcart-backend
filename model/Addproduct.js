const { default: mongoose } = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
 Title:String,
 Category:String,
 Weight:String,
 Unit:String,
 image:String,
 Description:String,
 ProductCode:String,
 ProductSKU:String,
 status:String,
 RegularPrice:String,
 SalePrice:String,
 MetaTitle:String,
 MetaDescription:String,
     vendorId:String,

    vendorName:String





  
});

const myproducts = mongoose.model('addproducts', userSchema);
module.exports=myproducts