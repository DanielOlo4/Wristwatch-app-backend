const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// ✅ Middleware to authenticate admin users
const adminAuth = async (req, res, next) => {
  try {
    // ✅ Extract token from Authorization header
    const authHeader = req.header("Authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach decoded info
    req.user = decoded;
    req.userData = decoded;

    // ✅ Role-based access check
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    // ✅ (Optional but safe) Verify admin still exists
    const adminExists = await Admin.findById(decoded.id);
    if (!adminExists) {
      return res.status(403).json({
        success: false,
        message: "Admin not found or unauthorized",
      });
    }

    req.admin = adminExists; // attach full admin doc
    next();
  } catch (error) {
    console.error("Admin auth error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = adminAuth;
