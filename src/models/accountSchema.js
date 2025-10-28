//const accountSchema = require("./account.schema");
const axios = require("axios");

const PaystackSecretKey = process.env.TEST_SECRET;

//Banklist from paystack
const bankList = async (req, res) => {
  try {
    const bankListResponse = await axios.get(
      "https://api.paystack.co/bank?", //CONTINUE FROM HERE
    );

  } catch (error) {}
};

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const accountSchema = new mongoose.Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      Ref: "Vendor",
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    accountName: {
      type: String,
      required: true,
    },

    bankCode: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    bankName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);