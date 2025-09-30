const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authmiddleware = require("../middleware/authmiddleware");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ========================
// ✅ Create new order (Client)
router.post("/", authmiddleware, async (req, res) => {
  try {
    const {
      fullname,
      address,
      city,
      place,
      contact,
      payment,
      items,
      totalPrice,
      deliveryCharges,
      email,
      transactionId,
      cardNumber,
      expiryDate,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Payment validation
    if ((payment === "easypaisa" || payment === "jazzcash") && !transactionId) {
      return res.status(400).json({ message: "Transaction ID required" });
    }
    if (payment === "card" && (!cardNumber || !expiryDate)) {
      return res.status(400).json({ message: "Card info required" });
    }

    // Format items
    const formattedItems = items.map((it) => ({
      productId: it.id ? new mongoose.Types.ObjectId(it.id) : undefined,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      image: it.image,
    }));

    let cardInfo = null;
    if (payment === "card") {
      cardInfo = {
        cardNumberMasked: "* * ** " + cardNumber.slice(-4),
        expiryDate,
      };
    }

    const order = new Order({
      user: req.user?.id,
      email: email || req.user?.email,
      fullname,
      address,
      city,
      place,
      contact,
      payment,
      transactionId: payment !== "cod" ? transactionId : undefined,
      cardInfo,
      items: formattedItems,
      totalPrice,
      deliveryCharges: deliveryCharges || 0,
    });

    const savedOrder = await order.save();

    // ✅ Send email confirmation
    const recipient = email || req.user?.email;
    const itemsHtml = formattedItems
      .map((it) => `<li>${it.name} x${it.quantity} — Rs ${it.price}</li>`)
      .join("");
    const grandTotal = totalPrice + (deliveryCharges || 0);

    const mailOptions = {
      from: `"MyStore" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `Order Confirmation — ${savedOrder._id}`,
      html: `
        <h2>Thank you, ${fullname}</h2>
        <p>Your order <b>#${savedOrder._id}</b> has been placed.</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Total: Rs ${grandTotal}</strong></p>
      `,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) console.error("❌ Email error:", err);
    });

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("❌ Order create error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get my orders
router.get("/my-orders", authmiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("❌ Get my orders error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get single order
router.get("/:id", authmiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("❌ Get order error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;