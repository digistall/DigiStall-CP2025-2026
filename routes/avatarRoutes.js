import express from 'express';
import multer from 'multer';
import {
  uploadFaceVerification,
  checkFaceVerification,
  getFaceImageBinary
} from '../BACKEND/STALLHOLDER/user/faceVerificationController.js';

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Upload and verify face image
router.post('/upload', upload.single('file'), uploadFaceVerification);

// Check if user has a verified face
router.get('/check/:stallholder_id', checkFaceVerification);

// Get the verified face image
router.get('/:stallholder_id', getFaceImageBinary);

export default router;
