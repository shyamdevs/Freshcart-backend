const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  firstname: { type: String, required: true, trim: true },
  lastname:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  phone:     { type: String, default: '' },
  isAdmin:   { type: Boolean, default: false },
  passwordResetToken:  { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },
}, { timestamps: true });

const myusers = mongoose.model('Signupusers', userSchema);
module.exports = myusers;