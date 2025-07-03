// Middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the 'uploads' folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: limit files to 5MB
  fileFilter: (req, file, cb) => {
    // Accept image files only
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

module.exports = upload;
