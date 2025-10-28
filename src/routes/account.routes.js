const express = require("express");
const { getAdimAccounts, verifyAccount, bankList } = require("../Controllers/account.controller");
const router = express.Router();


// Paystack bank list
router.get("/banks", bankList);

// Verify account & save
router.post("/verify", verifyAccount);

// Get vendor accounts
router.get("/:vendorId", getAdimAccounts);

module.exports = router;
