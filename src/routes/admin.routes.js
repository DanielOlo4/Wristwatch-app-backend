const express = require("express");
const adminRouter = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/admin"); // ✅ import admin middleware
const { registerAdmin, loginAdmin, getAdminProfile } = require("../Controllers/admin.controller");

// Admin signup
adminRouter.post("/register", registerAdmin);

// Admin login
adminRouter.post("/login", loginAdmin);

// Get admin profile (protected, admin only)
adminRouter.get("/profile", auth, isAdmin, getAdminProfile);

module.exports = adminRouter;
