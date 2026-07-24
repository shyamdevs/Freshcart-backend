const { default: mongoose } = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
 image: String,
 categoryName:String,
 slug:String,
 date:String,
 Description:String,
 Category:String,
 status:String,
 metaTitle:String,
 MetaDescription:String,



  
});

const mycategory = mongoose.model('addcategory', userSchema);
module.exports=mycategory