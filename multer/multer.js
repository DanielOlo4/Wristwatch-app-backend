const multer = require("multer");
const {v4: uuidv4} = require("uuid");
const path = require("path");
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `watch-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPEG, JPG, PNG, and WebP images are allowed"), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
});

// Use single file upload for watch images
const uploadSingleImg = upload.single("image");

module.exports = { 
  uploadSingleImg
};