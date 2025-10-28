const express = require("express");
const router = express.Router();
const watchCtrl = require("../Controllers/watch.controller");
const adminAuth = require("../middleware/adminAuth");
const { uploadSingleImg } = require("../../multer/multer");

// Public routes - anyone can view watches
router.get("/", watchCtrl.list);
router.get("/:id", watchCtrl.getById);

// Admin only routes - protected
router.post("/create-watches", adminAuth, uploadSingleImg, watchCtrl.create);
router.put("/:id", adminAuth, uploadSingleImg, watchCtrl.update);
router.delete("/:id", adminAuth, watchCtrl.remove);

module.exports = router;