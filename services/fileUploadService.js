const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const vendorLogoDir = path.join(uploadsDir, 'vendors');
  const productImageDir = path.join(uploadsDir, 'products');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  
  if (!fs.existsSync(vendorLogoDir)) {
    fs.mkdirSync(vendorLogoDir);
  }
  
  if (!fs.existsSync(productImageDir)) {
    fs.mkdirSync(productImageDir);
  }
};

// Initialize directories
createUploadsDir();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.originalUrl.includes('vendors') ? 'vendors' : 'products';
    const dest = path.join(__dirname, `../uploads/${fileType}`);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  
  // Check mime type
  const mimeTypeValid = allowedTypes.test(file.mimetype);
  
  // Check file extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimeTypeValid && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed'));
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Handle single file upload
 * @param {string} fieldName - Form field name for the file
 */
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

/**
 * Handle multiple file upload
 * @param {string} fieldName - Form field name for the files
 * @param {number} maxCount - Maximum number of files
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Get file URL
 * @param {string} filePath - Relative path to the file
 * @returns {string} Full URL to the file
 */
const getFileUrl = (filePath) => {
  // In a production environment, this would return a CDN or full domain URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/${filePath}`;
};

/**
 * Remove file
 * @param {string} filePath - Path to the file to remove
 */
const removeFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  
  return false;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  removeFile
};
