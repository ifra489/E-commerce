





const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },

    // 🖼️ main image (single)
    image: { type: String, default: "" },

    // 🖼️ multiple images
    images: [{ type: String }],

    description: { type: String, default: "" },
    category: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);