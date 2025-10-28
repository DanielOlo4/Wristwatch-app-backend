const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    
    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const actualToken = token.replace("Bearer ", "");
    
    // Verify token
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    // Find user based on role in token
    let user;
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
    } else {
      user = await User.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    // ✅ FIX: Set both id and _id for compatibility
    req.user = {
      id: user._id,        // For cart controller that uses req.user.id
      _id: user._id,       // For user controller that uses req.user._id
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

module.exports = auth;