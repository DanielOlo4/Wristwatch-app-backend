const mongoose = require("mongoose");

const watchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String },
    type: { type: String }, // e.g., Luxury, Sport, Smart
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String }, // url or path
  },
  { timestamps: true }
);

const watch = mongoose.model("Watch", watchSchema);
module.exports = watch
