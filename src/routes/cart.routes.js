// src/routes/cart.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  addItem,
  getCart,
  updateItem,
  removeItem,
  checkout,
  addItemToCart,
  initializePayment,
  verifyPayment,
} = require("../Controllers/cart.controller");

router.post("/add", auth, addItem);
router.get("/", auth, getCart);
router.put("/update", auth, updateItem);
router.delete("/remove/:itemId", auth, removeItem);
router.post("/checkout", auth, checkout);
router.post("/addItemToCart", auth, addItemToCart);

// ✅ ADDED PAYMENT ROUTES
router.post("/initialize-payment", auth, initializePayment);
router.get("/verify-payment/:reference", auth, verifyPayment);

module.exports = router;