const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    watch: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Watch", 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      default: 1 
    },
    deliveryStatus: {
      type: String,
      enum: ["Accept", "ready", "picked up", "on-the-way", "delivered", "canceled", "pending"],
      default: "pending",
    },
    price: { 
      type: Number, 
      default: 0 
    },
    totalItemPrice: { 
      type: Number, 
      default: 0 
    },
    totalPrice: { 
      type: Number, 
      default: 0 
    },
    deliveryAddress: {
      type: String,
      minlength: 10
    },
    deliveryPhone: {
      type: String,
      minlength: 11
    },
    paymentMethod: {
      type: String,
      enum: ["card", "transfer"],
      default: "card",
    },
    paidAt: Date,
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentReference: { 
      type: String 
    },
    paystackAccessCode: { 
      type: String 
    },
    orderStatus: {
      type: String, 
      enum: ["Unpaid", "Paid", "failed", "cancelled"],
      default: "Unpaid"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);