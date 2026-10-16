require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

// Models
const myusers = require("./model/Signup");
const mycategory = require("./model/Addcategory");
const myproducts = require("./model/Addproduct");
const myaddress = require("./model/Address");
const mycart = require("./model/Cart");
const mywishlist = require("./model/Wishlist");
const myreview = require("./model/Review");
const mypayment = require("./model/Payment");
const myorder = require("./model/Order");
const Vendor = require("./model/Vendor");

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.error("Database connection error:", err));

// Rate Limiter for Authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

// ==========================================
// Authentication & Authorization Middlewares
// ==========================================

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Missing or invalid token format"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized: Invalid or expired token"
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      status: false,
      message: "Forbidden: Admin access required"
    });
  }
  next();
};

// ==========================================
// User Authentication & Management Routes
// ==========================================

// User Signup
app.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const data = req.body.alldata || req.body;
    const { firstname, lastname, email, password, phone } = data;

    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "Firstname, lastname, email, and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await myusers.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new myusers({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      isAdmin: false
    });

    await newUser.save();

    return res.status(201).json({
      status: true,
      message: "User registered successfully"
    });
  } catch (err) {
    next(err);
  }
});

// User Signin
app.post("/signin", authLimiter, async (req, res, next) => {
  try {
    const data = req.body.signindata || req.body;
    const { email, password } = data;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await myusers.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password"
      });
    }

    const userPayload = {
      _id: user._id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone || "",
      isAdmin: Boolean(user.isAdmin)
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.status(200).json({
      status: true,
      token: token,
      user: userPayload
    });
  } catch (err) {
    next(err);
  }
});

// Update User Profile
app.post("/updateuser", authMiddleware, async (req, res, next) => {
  try {
    const b = req.body.userdata || req.body;
    const targetUserId = req.user.isAdmin && b._id ? b._id : req.user._id;

    if (b.email) {
      const normalizedEmail = b.email.toLowerCase().trim();
      const emailExists = await myusers.findOne({
        email: normalizedEmail,
        _id: { $ne: targetUserId }
      });

      if (emailExists) {
        return res.status(400).json({
          status: false,
          message: "Email already in use by another account"
        });
      }
    }

    const updateFields = {};
    if (b.firstname !== undefined) updateFields.firstname = b.firstname.trim();
    if (b.lastname !== undefined) updateFields.lastname = b.lastname.trim();
    if (b.email !== undefined) updateFields.email = b.email.toLowerCase().trim();
    if (b.phone !== undefined) updateFields.phone = b.phone;

    const result = await myusers
      .findByIdAndUpdate(targetUserId, updateFields, { new: true })
      .select("-password -passwordResetToken -passwordResetExpiry");

    if (result) {
      return res.status(200).json({
        status: true,
        user: result
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Update Password
app.post("/updatepassword", authMiddleware, async (req, res, next) => {
  try {
    const data = req.body;
    const { currentPassword, newPassword } = data;
    const targetUserId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        msg: "Current password and new password are required"
      });
    }

    const user = await myusers.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        msg: "Current password incorrect"
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await myusers.findByIdAndUpdate(targetUserId, {
      password: hashedNewPassword
    });

    return res.status(200).json({
      status: true,
      message: "Password updated successfully"
    });
  } catch (err) {
    next(err);
  }
});

// Delete Logged In User Account & Associated Data
app.post("/deleteaccount", authMiddleware, async (req, res, next) => {
  try {
    const targetUserId = req.user.isAdmin && req.body._id ? req.body._id : req.user._id;
    const user = await myusers.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    const userEmail = user.email;

    // Delete user document
    await myusers.findByIdAndDelete(targetUserId);

    // Delete associated cart, wishlist, orders, and addresses
    await mycart.deleteMany({ email: userEmail });
    await mywishlist.deleteMany({ email: userEmail });
    await myorder.deleteMany({
      $or: [{ userId: targetUserId.toString() }, { email: userEmail }]
    });
    await myaddress.deleteMany({ userid: targetUserId.toString() });

    return res.status(200).json({
      status: true,
      message: "Account and associated data deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get All Users / Customers
app.get("/allusers", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const users = await myusers
      .find()
      .select("-password -passwordResetToken -passwordResetExpiry")
      .sort({ _id: -1 });

    return res.status(200).json({
      status: true,
      myallusers: users
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Delete Customer
app.post("/deletecustomer", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const customerId = req.body.dltcus?._id || req.body._id;
    if (!customerId) {
      return res.status(400).json({
        status: false,
        message: "Customer ID is required"
      });
    }

    const customer = await myusers.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        status: false,
        message: "Customer not found"
      });
    }

    await myusers.findByIdAndDelete(customerId);
    await mycart.deleteMany({ email: customer.email });
    await mywishlist.deleteMany({ email: customer.email });
    await myaddress.deleteMany({ userid: customerId.toString() });

    return res.status(200).json({
      status: true,
      message: "Customer deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

// Forgot Password - Generate Reset Token
app.post("/forgetpass", authLimiter, async (req, res, next) => {
  try {
    const email = (req.body.forgetpass?.email || req.body.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required"
      });
    }

    const user = await myusers.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "No user found with this email"
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = expiryDate;
    await user.save();

    // Log note for mock email delivery
    console.log(`[AUTH] Password reset token generated for ${email}: ${resetToken}`);

    return res.status(200).json({
      status: true,
      message: "Password reset token generated (valid for 15 minutes)",
      token: resetToken
    });
  } catch (err) {
    next(err);
  }
});

// Reset Password - Verify Token and Update Password
app.post("/resetpassword", authLimiter, async (req, res, next) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "Token, email, and newPassword are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await myusers.findOne({ email: normalizedEmail });

    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired password reset request"
      });
    }

    if (new Date() > new Date(user.passwordResetExpiry)) {
      user.passwordResetToken = null;
      user.passwordResetExpiry = null;
      await user.save();
      return res.status(400).json({
        status: false,
        message: "Password reset token has expired"
      });
    }

    const isMatch = await bcrypt.compare(token, user.passwordResetToken);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid password reset token"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password reset successful"
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Category Management Routes
// ==========================================

// Admin: Add Category
app.post("/category", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const b = req.body.categoryvalue || req.body;
    const categoryDoc = new mycategory({
      image: b.image,
      categoryName: b.categoryName,
      slug: b.slug,
      date: b.date,
      Description: b.Description,
      Category: b.Category,
      status: b.status,
      metaTitle: b.metaTitle,
      MetaDescription: b.MetaDescription
    });

    const result = await categoryDoc.save();
    return res.status(201).json({
      status: true,
      category: result
    });
  } catch (err) {
    next(err);
  }
});

// Public: Get All Categories
app.get("/AllCategory", async (req, res, next) => {
  try {
    const a = await mycategory.find().sort({ _id: -1 });
    return res.status(200).json({
      status: true,
      myallcategory: a
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Update Category
app.post("/updatecategory", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const b = req.body.categoryvalue || req.body;
    const result = await mycategory.findByIdAndUpdate(
      b._id,
      {
        $set: {
          image: b.image,
          categoryName: b.categoryName,
          slug: b.slug,
          date: b.date,
          Description: b.Description,
          Category: b.Category,
          status: b.status,
          metaTitle: b.metaTitle,
          MetaDescription: b.MetaDescription
        }
      },
      { new: true }
    );

    if (result) {
      return res.status(200).json({
        status: true,
        category: result
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Category not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Admin: Delete Category
app.post("/deletecategory", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const catId = req.body.dltcat?._id || req.body._id;
    const result = await mycategory.findByIdAndDelete(catId);

    if (result) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(404).json({
        status: false,
        message: "Category not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Product Management Routes
// ==========================================

// Admin: Add Product
app.post("/product", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const b = req.body.productvalue || req.body;
    const productDoc = new myproducts({
      Title: b.Title,
      Category: b.Category,
      Weight: b.Weight,
      Unit: b.Unit,
      image: b.image,
      Description: b.Description,
      ProductCode: b.ProductCode,
      ProductSKU: b.ProductSKU,
      status: b.status,
      RegularPrice: b.RegularPrice,
      SalePrice: b.SalePrice,
      MetaTitle: b.MetaTitle,
      MetaDescription: b.MetaDescription,
      vendorId: b.vendorId,
      vendorName: b.vendorName
    });

    const result = await productDoc.save();
    return res.status(201).json({
      status: true,
      product: result
    });
  } catch (err) {
    next(err);
  }
});

// Public: Get All Products
app.get("/allproduct", async (req, res, next) => {
  try {
    const a = await myproducts.find().sort({ _id: -1 });
    return res.status(200).json({
      status: true,
      myallproduct: a
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Update Product
app.post("/updateproduct", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const b = req.body.productvalue || req.body;
    const result = await myproducts.findByIdAndUpdate(
      b._id,
      {
        Title: b.Title,
        Category: b.Category,
        Weight: b.Weight,
        Unit: b.Unit,
        image: b.image,
        Description: b.Description,
        ProductCode: b.ProductCode,
        ProductSKU: b.ProductSKU,
        status: b.status,
        RegularPrice: b.RegularPrice,
        SalePrice: b.SalePrice,
        MetaTitle: b.MetaTitle,
        MetaDescription: b.MetaDescription,
        vendorId: b.vendorId,
        vendorName: b.vendorName
      },
      { new: true }
    );

    if (result) {
      return res.status(200).json({ status: true, product: result });
    } else {
      return res.status(404).json({ status: false, message: "Product not found" });
    }
  } catch (err) {
    next(err);
  }
});

// Admin: Delete Product
app.post("/deleteproduct", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const proId = req.body.dltpro?._id || req.body._id;
    const result = await myproducts.findByIdAndDelete(proId);

    if (result) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(404).json({ status: false, message: "Product not found" });
    }
  } catch (err) {
    next(err);
  }
});

// Public: Search Products (with safe regex escaping)
app.get("/searchproduct", async (req, res, next) => {
  try {
    const keyword = (req.query.keyword || "").toString();
    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const products = await myproducts.find({
      Title: {
        $regex: safeKeyword,
        $options: "i"
      }
    });

    return res.status(200).json({
      status: true,
      products: products
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Address Management Routes
// ==========================================

// Add Address
app.post("/addaddress", authMiddleware, async (req, res, next) => {
  try {
    const b = req.body.addressdata || req.body;
    const userId = req.user._id.toString();

    if (b.IsDefault) {
      await myaddress.updateMany(
        { userid: userId },
        { $set: { IsDefault: false } }
      );
    }

    const addressDoc = new myaddress({
      userid: userId,
      FirstName: b.FirstName,
      LastName: b.LastName,
      AddressLine1: b.AddressLine1,
      AddressLine2: b.AddressLine2,
      City: b.City,
      Country: b.Country,
      State: b.State,
      ZipCode: b.ZipCode,
      BusinessName: b.BusinessName,
      IsDefault: Boolean(b.IsDefault)
    });

    const saved = await addressDoc.save();
    return res.status(201).json({
      status: true,
      address: saved
    });
  } catch (err) {
    next(err);
  }
});

// Get Addresses for logged-in user
app.post("/getaddress", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const result = await myaddress.find({ userid: userId });

    return res.status(200).json({
      status: true,
      addresses: result
    });
  } catch (err) {
    next(err);
  }
});

// Set Default Address
app.post("/setdefaultaddress", authMiddleware, async (req, res, next) => {
  try {
    const { addressId } = req.body;
    const userId = req.user._id.toString();

    if (!addressId) {
      return res.status(400).json({
        status: false,
        message: "Address ID is required"
      });
    }

    // Verify address belongs to the logged-in user
    const address = await myaddress.findOne({ _id: addressId, userid: userId });
    if (!address) {
      return res.status(404).json({
        status: false,
        message: "Address not found or unauthorized"
      });
    }

    await myaddress.updateMany(
      { userid: userId },
      { $set: { IsDefault: false } }
    );

    await myaddress.findByIdAndUpdate(addressId, {
      IsDefault: true
    });

    return res.status(200).json({
      status: true
    });
  } catch (err) {
    next(err);
  }
});

// Delete Address
app.post("/deleteaddress", authMiddleware, async (req, res, next) => {
  try {
    const addressId = req.body._id;
    const userId = req.user._id.toString();

    const query = req.user.isAdmin
      ? { _id: addressId }
      : { _id: addressId, userid: userId };

    const result = await myaddress.findOneAndDelete(query);

    if (result) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(404).json({
        status: false,
        message: "Address not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Cart Management Routes
// ==========================================

// Add To Cart
app.post("/addtocart", authMiddleware, async (req, res, next) => {
  try {
    const product = req.body;
    const userEmail = req.user.email;
    const productId = product.productId || product._id;

    if (!productId) {
      return res.status(400).json({
        status: false,
        message: "Product ID is required"
      });
    }

    const already = await mycart.findOne({
      productId: productId,
      email: userEmail
    });

    if (already) {
      return res.status(200).json({
        status: false,
        message: "Already Added"
      });
    }

    const cart = new mycart({
      productId: productId,
      email: userEmail,
      Title: product.Title,
      Category: product.Category,
      image: product.image,
      Weight: product.Weight,
      SalePrice: Number(product.SalePrice) || 0,
      RegularPrice: Number(product.RegularPrice) || 0,
      quantity: Number(product.quantity) || 1
    });

    await cart.save();
    return res.status(201).json({ status: true });
  } catch (err) {
    next(err);
  }
});

// Get Cart Items (supports both POST and GET)
const getCartHandler = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const data = await mycart.find({ email: userEmail });

    return res.status(200).json({
      status: true,
      mycart: data
    });
  } catch (err) {
    next(err);
  }
};

app.post("/cart", authMiddleware, getCartHandler);
app.get("/cart", authMiddleware, getCartHandler);

// Delete Single Cart Item
app.post("/deleteshopcart", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const result = await mycart.findOneAndDelete({
      _id: req.body._id,
      email: userEmail
    });

    if (result) {
      return res.status(200).json({
        status: true,
        message: "Product removed from cart"
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Product not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Delete Cart Item (Alternate Endpoint)
app.post("/deletecart", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const result = await mycart.findOneAndDelete({
      _id: req.body._id,
      email: userEmail
    });

    if (result) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(404).json({ status: false });
    }
  } catch (err) {
    next(err);
  }
});

// Cart Total Quantity Count
app.post("/cartcount", authMiddleware, async (req, res, next) => {
  try {
    const email = req.user?.email || req.body.email;
    if (!email) {
      return res.status(200).json({ status: false, count: 0 });
    }

    const result = await mycart.aggregate([
      { $match: { email: email } },
      { $group: { _id: null, totalQty: { $sum: "$quantity" } } }
    ]);

    const total = result.length > 0 ? result[0].totalQty : 0;
    return res.status(200).json({
      status: true,
      count: total
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Wishlist Management Routes
// ==========================================

// Add to Wishlist
app.post("/addwishlist", authMiddleware, async (req, res, next) => {
  try {
    const product = req.body;
    const userEmail = req.user.email;
    const productId = product.productId || product._id;

    if (!productId) {
      return res.status(400).json({
        status: false,
        msg: "Product ID is required"
      });
    }

    const already = await mywishlist.findOne({
      productId: productId,
      email: userEmail
    });

    if (already) {
      return res.status(200).json({
        status: false,
        msg: "Already Added"
      });
    }

    const wishlist = new mywishlist({
      productId: productId,
      Title: product.Title,
      Category: product.Category,
      Weight: product.Weight,
      image: product.image,
      SalePrice: Number(product.SalePrice) || 0,
      RegularPrice: Number(product.RegularPrice) || 0,
      email: userEmail,
      status: product.status || ""
    });

    await wishlist.save();
    return res.status(201).json({ status: true });
  } catch (err) {
    next(err);
  }
});

// Get User Wishlist
app.post("/wishlist", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const result = await mywishlist.find({ email: userEmail });

    return res.status(200).json({
      status: true,
      mywishlist: result
    });
  } catch (err) {
    next(err);
  }
});

// Delete Wishlist Item
app.post("/deletewishlist", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const result = await mywishlist.findOneAndDelete({
      _id: req.body._id,
      email: userEmail
    });

    if (result) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(404).json({ status: false });
    }
  } catch (err) {
    next(err);
  }
});

// Wishlist Count
app.post("/wishlistcount", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const count = await mywishlist.countDocuments({ email: userEmail });

    return res.status(200).json({
      status: true,
      count: count
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Review Management Routes
// ==========================================

// Add Product Review
app.post("/addreview", authMiddleware, async (req, res, next) => {
  try {
    const b = req.body;
    const product = await myproducts.findById(b.productId);

    const reviewDoc = new myreview({
      productId: b.productId,
      productName: product ? product.Title : b.productName || "Unknown Product",
      name: b.name || `${req.user.firstname} ${req.user.lastname}`.trim(),
      email: req.user.email,
      rating: Number(b.rating) || 0,
      review: b.review || ""
    });

    await reviewDoc.save();
    return res.status(201).json({ status: true });
  } catch (err) {
    next(err);
  }
});

// Public: Get Reviews by Product ID
app.post("/getreview", async (req, res, next) => {
  try {
    const result = await myreview.find({
      productId: req.body.productId
    });

    return res.status(200).json({
      status: true,
      myreview: result
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Delete Review
app.post("/deletereview", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const id = req.body.id || req.body._id;
    const result = await myreview.findByIdAndDelete(id);

    if (result) {
      return res.status(200).json({ status: true });
    } else {
      return res.status(404).json({
        status: false,
        message: "Review not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Update Review
app.post("/updatereview", authMiddleware, async (req, res, next) => {
  try {
    const b = req.body;
    const query = req.user.isAdmin
      ? { _id: b._id }
      : { _id: b._id, email: req.user.email };

    const updateFields = {};
    if (b.name !== undefined) updateFields.name = b.name;
    if (b.rating !== undefined) updateFields.rating = Number(b.rating);
    if (b.review !== undefined) updateFields.review = b.review;

    const result = await myreview.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true }
    );

    if (result) {
      return res.status(200).json({
        status: true,
        review: result
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Review not found or unauthorized"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Admin: Get All Reviews
app.get("/allreviews", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const a = await myreview.find().sort({ _id: -1 });
    return res.status(200).json({
      status: true,
      myallreviews: a
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Payment Routes (PCI-DSS Compliant)
// ==========================================

// Direct payment card storage is disabled for PCI-DSS compliance.
app.post("/getpayment", authMiddleware, (req, res) => {
  return res.status(200).json({
    status: false,
    message: "Card storage is disabled. Use Razorpay saved cards."
  });
});

app.post("/deletepayment", authMiddleware, (req, res) => {
  return res.status(200).json({
    status: false,
    message: "Card storage is disabled. Use Razorpay saved cards."
  });
});

// Razorpay Order Creation Endpoint
// NOTE: Production implementation requires the 'razorpay' npm package and environment variables:
// RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
// const Razorpay = require('razorpay');
// const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
app.post("/createrazorpayorder", authMiddleware, async (req, res, next) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        status: false,
        message: "A valid positive amount is required"
      });
    }

    const mockOrderId =
      "order_" + Date.now() + Math.random().toString(36).substr(2, 4);

    return res.status(200).json({
      status: true,
      orderId: mockOrderId,
      amount: Number(amount),
      currency: currency || "INR"
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Order Management Routes
// ==========================================

// Add New Order
app.post("/addorder", authMiddleware, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user._id.toString();

    let rawProducts = req.body.products;
    if (!rawProducts) {
      rawProducts = [req.body];
    } else if (!Array.isArray(rawProducts)) {
      rawProducts = [rawProducts];
    }

    if (rawProducts.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No products provided for order"
      });
    }

    // Generate secure order number server-side
    const serverOrderNo =
      "#" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderDate = new Date().toISOString();

    const orderDocuments = rawProducts.map((p) => ({
      userId: userId,
      customerName:
        p.customerName || `${req.user.firstname} ${req.user.lastname}`.trim(),
      email: userEmail,
      phone: p.phone || req.user.phone || "",
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      country: p.country || "",
      zipCode: p.zipCode || "",
      productId: p.productId || p._id || "",
      Title: p.Title || "",
      image: p.image || "",
      Weight: p.Weight || "",
      SalePrice: Number(p.SalePrice) || 0,
      quantity: Number(p.quantity) || 1,
      orderNo: p.orderNo || serverOrderNo,
      date: p.date || orderDate,
      status: p.status || "Pending"
    }));

    const result = await myorder.insertMany(orderDocuments);

    if (result && result.length > 0) {
      // Delete ONLY the ordering user's cart
      await mycart.deleteMany({ email: userEmail });

      return res.status(201).json({
        status: true,
        orderNo: serverOrderNo,
        orders: result
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed to place order"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Admin: Get All Orders
app.get("/orders", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const result = await myorder.find().sort({ _id: -1 });
    return res.status(200).json({
      status: true,
      myorders: result
    });
  } catch (err) {
    next(err);
  }
});

// User Orders (Only Logged-in User)
app.post("/myorders", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const userEmail = req.user.email;

    const result = await myorder
      .find({
        $or: [{ userId: userId }, { email: userEmail }]
      })
      .sort({ _id: -1 });

    return res.status(200).json({
      status: true,
      myorders: result
    });
  } catch (err) {
    next(err);
  }
});

// Single Order Details
app.post("/ordersingle", authMiddleware, async (req, res, next) => {
  try {
    const { orderNo } = req.body;
    if (!orderNo) {
      return res.status(400).json({
        status: false,
        message: "Order number is required"
      });
    }

    const query = req.user.isAdmin
      ? { orderNo: orderNo }
      : {
          orderNo: orderNo,
          $or: [{ userId: req.user._id.toString() }, { email: req.user.email }]
        };

    const result = await myorder.find(query);

    return res.status(200).json({
      status: true,
      order: result
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Update Order Status
app.post("/updateorderstatus", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { orderNo, status } = req.body;
    if (!orderNo || !status) {
      return res.status(400).json({
        status: false,
        message: "Order number and status are required"
      });
    }

    const result = await myorder.updateMany(
      { orderNo: orderNo },
      { $set: { status: status } }
    );

    return res.status(200).json({
      status: true,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Vendor / Seller Routes
// ==========================================

// Admin: Add Vendor
app.post("/addvendor", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const b = req.body.vendorvalue || req.body;
    const vendorDoc = new Vendor({
      vendorName: b.vendorName,
      sellerId: b.sellerId,
      email: b.email,
      phone: b.phone,
      address: b.address,
      image: b.image
    });

    const result = await vendorDoc.save();
    return res.status(201).json({
      status: true,
      vendor: result
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get All Vendors
app.get("/allvendor", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const a = await Vendor.find().sort({ _id: -1 });
    return res.status(200).json({
      status: true,
      myallvendor: a
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Vendor Dashboard Summary
app.get("/vendordashboard", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const vendors = await Vendor.find();
    const data = [];

    for (const vendor of vendors) {
      const products = await myproducts.find({
        vendorId: vendor._id.toString()
      });

      const productIds = products.map((item) => item._id.toString());

      const orders = await myorder.find({
        productId: { $in: productIds }
      });

      let grossSale = 0;
      orders.forEach((item) => {
        grossSale += (Number(item.SalePrice) || 0) * (Number(item.quantity) || 1);
      });

      const earning = Number((grossSale * 0.8).toFixed(2));

      data.push({
        _id: vendor._id,
        vendorName: vendor.vendorName,
        sellerId: vendor.sellerId,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        image: vendor.image,
        totalProducts: products.length,
        totalOrders: orders.length,
        grossSale: grossSale,
        earning: earning
      });
    }

    return res.status(200).json({
      status: true,
      vendors: data
    });
  } catch (err) {
    next(err);
  }
});

// Public: Get Vendor by ID
app.post("/vendorbyid", async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.body.vendorId);
    if (vendor) {
      return res.status(200).json({
        status: true,
        vendor: vendor
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Vendor not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// Admin: Delete Vendor
app.post("/deletevendor", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const id = req.body.id || req.body._id;
    const vendor = await Vendor.findByIdAndDelete(id);

    if (vendor) {
      return res.status(200).json({
        status: true,
        message: "Vendor deleted successfully"
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Vendor not found"
      });
    }
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Base, 404 & Global Error Handling
// ==========================================

// API Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: "FreshCart API is running"
  });
});

// 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route not found"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    message: "Internal server error"
  });
});

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`FreshCart backend running on port ${PORT}`);
});