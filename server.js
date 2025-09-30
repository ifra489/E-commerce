



// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");
const jwt = require("jsonwebtoken");


require("dotenv").config();

// ===== Models =====
const User = require("./models/User");

// ===== Routes =====
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes=require("./routes/adminRoutes")
const categoryRoutes=require("./routes/categoryRoutes");
const adminOrderRoutes=require("./routes/adminOrderRoutes");
const adminUserRoutes=require("./routes/adminUserRoutes");
const app = express();

// ===== Middleware =====
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "http://localhost:3000",
  ],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// ===== Serve frontend =====
app.use(express.static(path.join(__dirname, "ClientSide")));

// ===== Passport serialize/deserialize =====
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ===== Google OAuth Strategy =====
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          password: null
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// ===== API Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories",categoryRoutes);
app.use("/api/admin/orders",adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
// ===== Google Auth Routes =====
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/loginregister.html" }),
  (req, res) => {
    const accessToken = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Save refresh token in DB
    req.user.refreshToken = refreshToken;
    req.user.save();

    // ✅ Send both tokens in query params
    res.redirect(`/loginregister.html?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

// ===== Default route =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "ClientSide", "loginregister.html"));
});

// ===== MongoDB connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// ===== Start server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
