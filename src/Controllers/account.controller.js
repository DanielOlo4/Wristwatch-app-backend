const Account = require("./account.schema");
const axios = require("axios");

const PaystackSecretKey = process.env.TEST_SECRET;

// ✅ Axios instance with Paystack Authorization
const paystackAPI = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PaystackSecretKey}`,
    "Content-Type": "application/json",
  },
});

// Get list of banks (Paystack)

const bankList = async (req, res) => {
  try {
    const response = await paystackAPI.get("/bank?currency=NGN");
    return res.status(200).json({
      success: true,
      data: response.data.data, // paystack returns {status, message, data}
    });
  } catch (error) {
    console.error("Bank list error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bank list",
    });
  }
};


// Verify bank account number with Paystack

const verifyAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode, vendor } = req.body;

    if (!accountNumber || !bankCode || !vendor) {
      return res.status(400).json({
        success: false,
        message: "accountNumber, bankCode, and vendor are required",
      });
    }

    // Call Paystack endpoint
    const response = await paystackAPI.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );

    if (response.data.status) {
      // Save in DB
      const account = new Account({
        vendor,
        accountNumber,
        bankCode,
        accountName: response.data.data.account_name,
        bankName: response.data.data.bank_name || "", // sometimes returned
        isVerified: true,
      });

      await account.save();

      return res.status(201).json({
        success: true,
        message: "Account verified and saved",
        data: account,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Account verification failed",
      });
    }
  } catch (error) {
    console.error("Verify account error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying account",
      error: error.response?.data || error.message,
    });
  }
};

// -------------------------
// Get admin accounts
// -------------------------
const getAdimAccounts = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const accounts = await Account.find({ vendor: vendorId });
    return res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching accounts",
    });
  }
};

module.exports = { bankList, verifyAccount, getAdimAccounts };
