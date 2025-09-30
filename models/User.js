const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },          // optional for Google login
    googleId: { type: String },          // store Google ID
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshToken: String,

    // 🔹 Active ya Blocked user ke liye
    status: { type: String, enum: ["active", "blocked"], default: "active" }
  },
  { timestamps: true } // ✅ createdAt, updatedAt automatically add honge
);

module.exports = mongoose.model("User", userSchema);