// src/middleware/admin.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AdminModel = require("../models/Admin"); // ✅ Admin schema

const admin = async function (req, res, next) {
  const authHeader = req.header("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // attach user to request
    req.user = { _id: payload.id || payload._id || payload.userId };

    // ✅ check if user exists in Admin collection
    const adminDoc = await AdminModel.findById(req.user._id);
    if (!adminDoc) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access only" });
    }

    req.admin = adminDoc;
    next();
  } catch (err) {
    console.error("admin middleware error:", err);
    return res
      .status(401)
      .json({ success: false, message: "Token is not valid" });
  }
};

module.exports = admin;
