const express = require("express");
const router = express.Router();

const authmiddleware = require("../middleware/authmiddleware"); 

const adminmiddleware=require("../middleware/adminmiddleware")
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

// ✅ Dashboard Stats
router.get("/stats", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.json({ totalUsers, totalOrders, totalProducts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// // ✅ Get All Users
// router.get("/users", authmiddleware, adminmiddleware, async (req, res) => {
//   try {
//     const users = await User.find().select("-password -refreshToken");
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });



// ✅ Get All Products
router.get("/products", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;