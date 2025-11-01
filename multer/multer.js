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

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, JPG, PNG, and WebP images are allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// UNIVERSAL upload middleware that accepts ANY field name
const uploadSingleImg = (req, res, next) => {
  // Use upload.any() to accept files from ANY field name
  const uploadAny = upload.any();
  
  uploadAny(req, res, function (err) {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        // Other multer errors
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }
      
      // Handle other errors
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Process uploaded files - accept ANY field name
    if (req.files && req.files.length > 0) {
      // Get the first uploaded file (regardless of field name)
      const uploadedFile = req.files[0];
      
      // Make it available as req.file for compatibility
      req.file = uploadedFile;
      
      // Add file info to request body
      req.body.image = uploadedFile.filename;
      req.body.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${uploadedFile.filename}`;
      
      console.log(`File uploaded successfully: ${uploadedFile.originalname} as ${uploadedFile.filename} from field: ${uploadedFile.fieldname}`);
    } else {
      // No file uploaded
      if (req.method === 'POST') {
        return res.status(400).json({
          success: false,
          message: 'Image is required for creating a watch'
        });
      }
      // For PUT/PATCH, image is optional
    }
    
    next();
  });
};

module.exports = { 
  uploadSingleImg // This now accepts ANY field name
};