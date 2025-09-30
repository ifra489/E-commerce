const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const nodemailer = require("nodemailer");

const Order = require("../models/Order");
const User = require("../models/User");
const authmiddleware = require("../middleware/authmiddleware");
const adminmiddleware = require("../middleware/adminmiddleware");

// ✅ Email sender config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // ⚠️ set in .env
    pass: process.env.EMAIL_PASS
  }
});

// ===============================
// 🔹 EXPORT ROUTES (All Orders)
// ===============================



// ✅ Export all orders as Excel
router.get("/export/excel", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders Report");

    sheet.columns = [
      { header: "Order ID", key: "id", width: 30 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Paid", key: "isPaid", width: 10 },
      { header: "Total", key: "total", width: 15 },
      { header: "Date", key: "date", width: 20 },
    ];

    orders.forEach((o) => {
      sheet.addRow({
        id: o._id.toString(),
        customer: o.fullname || o.user?.name || "N/A",
        email: o.email || o.user?.email || "N/A",
        status: o.status,
        payment: o.payment,
        isPaid: o.isPaid ? "Paid" : "Unpaid",
        total: o.totalPrice + (o.deliveryCharges || 0),
        date: new Date(o.createdAt).toLocaleString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Excel Export Error:", err);
    res.status(500).json({ message: "Server error while exporting Excel" });
  }
});

// ✅ Export all orders as PDF
router.get("/export/pdf", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=orders.pdf");

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(20).text("📊 All Orders Report", { align: "center" });
    doc.moveDown();

    orders.forEach((o, i) => {
      doc.fontSize(14).text(`Order #${i + 1}`);
      doc.text(`Customer: ${o.fullname || o.user?.name} (${o.email || o.user?.email})`);
      doc.text(`Status: ${o.status}`);
      doc.text(`Payment: ${o.payment}`);
      doc.text(`Paid: ${o.isPaid ? "✅ Paid" : "❌ Unpaid"}`);
      doc.text(`Total: Rs ${o.totalPrice + (o.deliveryCharges || 0)}`);
      doc.text(`Date: ${new Date(o.createdAt).toLocaleString()}`);
      doc.moveDown();

      doc.text("Items:");
      o.items.forEach(it => {
        doc.text(`- ${it.name || it.productId?.name || "Unknown"} (${it.quantity} x Rs ${it.price || 0})`);
      });

      doc.moveDown();
      doc.text("---------------------------------------------------");
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error("❌ PDF Export Error:", err);
    res.status(500).json({ message: "Server error while exporting PDF" });
  }
});

// ===============================
// 🔹 MAIN CRUD ROUTES
// ===============================

// ✅ Get all orders
router.get("/", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    let { page = 1, limit = 10, status, sort = "desc", search, from, to, payment } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};
    if (status) query.status = status;
    if (payment) query.payment = payment;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);

      query.$or = [
        { user: { $in: userIds } },
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { _id: mongoose.Types.ObjectId.isValid(search) ? search : null },
      ].filter(Boolean);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.productId", "name price image")
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      totalOrders: total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get single order
router.get("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.productId", "name price image");

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Export single order as PDF (Invoice)
router.get("/:id/pdf", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.productId", "name price");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=order_${order._id}.pdf`);

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(22).text("🧾 Order Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Invoice #: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Customer: ${order.fullname || order.user?.name}`);
    doc.text(`Email: ${order.email || order.user?.email}`);
    doc.text(`Payment: ${order.payment}`);
    doc.text(`Paid: ${order.isPaid ? "✅ Paid" : "❌ Unpaid"}`);
    doc.moveDown();

    doc.fontSize(16).text("Items:", { underline: true });
    order.items.forEach(it => {
      doc.fontSize(12).text(
        `${it.name || it.productId?.name || "Unknown"} - ${it.quantity} x Rs ${it.price || it.productId?.price || 0}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Delivery: Rs ${order.deliveryCharges || 0}`);
    doc.fontSize(16).text(`Total: Rs ${order.totalPrice + (order.deliveryCharges || 0)}`);

    doc.end();
  } catch (err) {
    console.error("❌ Single Invoice Error:", err);
    res.status(500).json({ message: "Server error while generating invoice" });
  }
});

// ✅ Update order status
router.put("/:id/status", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const { status, isPaid } = req.body;
    const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    // ✅ Handle Paid/Unpaid
    if (order.payment === "cod") {
      if (typeof isPaid !== "undefined") order.isPaid = isPaid;
    } else {
      order.isPaid = true; // online payments auto-paid
    }

    await order.save();

    // ✅ Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.email,
      subject: `Order #${order._id} Status Updated`,
      html: `
        <h3>Hello ${order.fullname},</h3>
        <p>Your order <b>#${order._id}</b> status has been updated.</p>
        <p><b>Status:</b> ${order.status}</p>
        <p><b>Payment:</b> ${order.payment} (${order.isPaid ? "Paid" : "Unpaid"})</p>
        <p><b>Total:</b> Rs ${order.totalPrice + (order.deliveryCharges || 0)}</p>
        <p>Thanks for shopping with us!</p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("❌ Email error:", err);
      else console.log("📧 Email sent:", info.response);
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete order
router.delete("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;