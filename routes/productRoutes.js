const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const authmiddleware = require("../middleware/authmiddleware");
const adminmiddleware = require("../middleware/adminmiddleware");

/**
 * ✅ Add new product (Admin only)
 */
router.post("/", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const productData = { ...req.body };

    // Agar images array di gayi hai
    if (Array.isArray(productData.images) && productData.images.length > 0) {
      // Pehli image ko main image bana do
      productData.image = productData.images[0];
    }

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * ✅ Get all products (Public)
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * ✅ Get single product by ID (Public)
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * ✅ Update product (Admin only)
 */
router.put("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const productData = { ...req.body };

    // Agar images array di gayi hai
    if (Array.isArray(productData.images) && productData.images.length > 0) {
      productData.image = productData.images[0];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * ✅ Delete product (Admin only)
 */
router.delete("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;