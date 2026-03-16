const multer = require('multer');
const { brandAssetsStorage, avatarStorage, taskFilesStorage } = require('../config/cloudinary');

// File filter for brand assets
const brandAssetsFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// File filter for task deliverables (images, videos, design files)
const taskFilesFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Documents
    'application/pdf',
    // Design files
    'application/postscript', 'image/vnd.adobe.photoshop', 'application/illustrator',
    'application/x-sketch', 'application/x-figma',
    // Archives
    'application/zip', 'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Images, videos, documents, and design files are allowed.'), false);
  }
};

// File filter for avatars
const avatarFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed for avatars.'), false);
  }
};

// Multer upload for brand assets
const uploadBrandAssets = multer({
  storage: brandAssetsStorage,
  fileFilter: brandAssetsFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
}).array('files', 10); // Max 10 files

// Multer upload for single avatar
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  }
}).single('avatar');

// Multer upload for task deliverables
const uploadTaskFiles = multer({
  storage: taskFilesStorage,
  fileFilter: taskFilesFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max for videos
  }
}).array('files', 20); // Max 20 files per task

// Error handling wrapper
const handleUpload = (upload) => {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum is 10 files.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadBrandAssets,
  uploadAvatar,
  uploadTaskFiles,
  handleUpload
};