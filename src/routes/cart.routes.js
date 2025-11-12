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
  getPaymentStatus
} = require("../Controllers/cart.controller");

// 🛒 CART ITEM ROUTES
router.post("/add", auth, addItem);
router.get("/", auth, getCart);
router.put("/update", auth, updateItem);
router.delete("/remove/:itemId", auth, removeItem);
router.post("/addItemToCart", auth, addItemToCart);

// 💳 PAYMENT ROUTES
router.post("/checkout", auth, checkout);
router.post("/initialize-payment", auth, initializePayment);
router.get("/verify-payment/:reference", verifyPayment); // No auth needed for Paystack callback
router.get("/payment-status/:reference", auth, getPaymentStatus);

module.exports = router;