// middleware/authmiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * ✅ Basic authentication middleware
 * - Checks if access token is valid
 * - Attaches decoded user data (id, email, role) to req.user
 */
function authmiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * ✅ Middleware to allow only admins
 */
function adminmiddleware(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
}

// 👇 Export as separate middlewares (not object)
module.exports = authmiddleware;
module.exports.adminmiddleware = adminmiddleware;