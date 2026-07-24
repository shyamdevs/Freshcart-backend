const { default: mongoose } = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  firstname:String,
  lastname:String,
  email : String , 
  password: String,
      phone: {
        type: String,
        default: ""
    }
});

const myusers = mongoose.model('Signupusers', userSchema);
module.exports=myusers