const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'addproducts' },
  Title:        String,
  Category:     String,
  Weight:       String,
  image:        String,
  SalePrice:    Number,
  RegularPrice: Number,
  email:        { type: String, required: true },
  status:       String
});

WishlistSchema.index({ productId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('wishlist', WishlistSchema);