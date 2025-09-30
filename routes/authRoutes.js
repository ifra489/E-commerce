// authRoutes.js
console.log("📌 authRoutes.js loaded");

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Test route
router.get("/check", (req, res) => {
  console.log("🔥 /check route hit hua");
  res.send("✅ Auth route is working");
});

// ✅ Register (default role = user)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // role agar bheja gaya hai aur "admin" hai to use kare, warna "user"
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || "user" 
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Login with refresh token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Short-lived access token
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, // 👈 role bhi add
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    // Long-lived refresh token
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, // 👈 role bhi add
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ 
      accessToken, 
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Refresh access token
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, // 👈 role bhi add
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

module.exports = router;