const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authmiddleware = require("../middleware/authmiddleware");
const adminmiddleware = require("../middleware/adminmiddleware");

// ================================
// 🔹 Get All Users
// ================================
router.get("/", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error fetching users", error: err.message });
  }
});

// ================================
// 🔹 Get Single User Detail
// ================================
router.get("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error fetching user", error: err.message });
  }
});

// ================================
// 🔹 Update User (role, name, status)
// ================================
router.put("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const { name, role, status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, status },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "✅ User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error updating user", error: err.message });
  }
});

// ================================
// 🔹 Block User
// ================================
router.put("/:id/block", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "blocked" },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "🚫 User blocked", user });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error blocking user", error: err.message });
  }
});

// ================================
// 🔹 Unblock User
// ================================
router.put("/:id/unblock", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "✅ User unblocked", user });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error unblocking user", error: err.message });
  }
});

// ================================
// 🔹 Delete User
// ================================
router.delete("/:id", authmiddleware, adminmiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "🗑️ User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error deleting user", error: err.message });
  }
});

module.exports = router;