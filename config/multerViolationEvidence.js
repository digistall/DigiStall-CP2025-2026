// =============================================
// MULTER CONFIGURATION FOR VIOLATION EVIDENCE PHOTOS
// =============================================
// Purpose: Handle photo uploads for violation reports
// Max: 5 photos per violation report
// Max Size: 10MB each
// Allowed: PNG, JPG, JPEG
// Storage: uploads/violations/{year}/{month}/{violation_id}/
// =============================================

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR_VIOLATIONS || path.join(__dirname, '..', 'uploads', 'violations');

// Ensure base directory exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
  console.log(`✅ Created violations upload directory: ${BASE_UPLOAD_DIR}`);
}

// Configure storage with dynamic folder creation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // Create folder path: /violations/{year}/{month}/
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const uploadPath = path.join(BASE_UPLOAD_DIR, String(year), month);
      
      // Create directories recursively if they don't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`✅ Created directory: ${uploadPath}`);
      }
      
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ Error creating directory:', error);
      cb(error, null);
    }
  },
  
  filename: function (req, file, cb) {
    try {
      // Generate unique filename with UUID
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      
      // Generate filename: {timestamp}_{uuid}.jpg
      const filename = `${timestamp}_${uniqueId}${ext}`;
      
      cb(null, filename);
    } catch (error) {
      console.error('❌ Error generating filename:', error);
      cb(error, null);
    }
  }
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  
  if (allowedTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed!'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5 // Maximum 5 files per upload
  }
});

// Export the upload middleware for multiple files
export const uploadViolationEvidence = upload.array('evidence_photos', 5);

// Export single file upload for legacy support
export const uploadSingleEvidence = upload.single('evidence_photo');

// Helper function to generate the public URL for an uploaded file
export const generateEvidenceUrl = (filename, year, month) => {
  const baseUrl = process.env.EVIDENCE_BASE_URL || '';
  return `${baseUrl}/uploads/violations/${year}/${month}/${filename}`;
};

// Helper function to delete evidence files
export const deleteEvidenceFile = (filePath) => {
  try {
    const fullPath = path.join(BASE_UPLOAD_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted evidence file: ${fullPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting evidence file:', error);
    return false;
  }
};

// Get the base upload directory
export const getBaseUploadDir = () => BASE_UPLOAD_DIR;

export default upload;


