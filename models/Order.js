

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  price: Number,
  quantity: Number,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  email: { type: String, required: true },
  fullname: { type: String, required: true },
  address: { type: String, required: true },
  city: String,
  place: String,
  contact: String,

  payment: { 
    type: String, 
    enum: ["cod","easypaisa","jazzcash","card"], 
    default: "cod" 
  },
isPaid: { type: Boolean, default: false },   // ✅ NEW FIELD
  // ✅ For Easypaisa/Jazzcash
  transactionId: { type: String },

  // ✅ For Card
  cardInfo: {
    cardNumberMasked: String,   // e.g. ** ** ** 1234
    expiryDate: String          // e.g. 12/25
  },

  items: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  deliveryCharges: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ["Pending","Processing","Shipped","Delivered","Cancelled"], 
    default: "Pending" 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);