const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for brand assets
const brandAssetsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'brand-assets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'svg', 'webp'],
    resource_type: 'auto',
    transformation: [
      { width: 2000, height: 2000, crop: 'limit' }
    ]
  }
});

// Configure storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' }
    ]
  }
});

// Configure storage for task deliverables (creative assets)
const taskFilesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'task-deliverables',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm', 'pdf', 'psd', 'ai', 'sketch', 'fig', 'zip'],
    resource_type: 'auto'
  }
});

module.exports = {
  cloudinary,
  brandAssetsStorage,
  avatarStorage,
  taskFilesStorage
};