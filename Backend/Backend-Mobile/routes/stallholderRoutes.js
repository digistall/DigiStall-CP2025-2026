import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStallholderStallsWithDocuments,
  getBranchDocumentRequirements,
  uploadStallholderDocument
} from '../controllers/user/stallholderDocumentController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  }
});

// ===== STALLHOLDER DOCUMENT ROUTES =====

/**
 * @route GET /api/mobile/stallholder/documents/:applicantId
 * @desc Get all stalls owned by stallholder with document requirements grouped by branch
 * @access Public (should be protected in production)
 */
router.get('/documents/:applicantId', getStallholderStallsWithDocuments);

/**
 * @route GET /api/mobile/stallholder/documents/branch/:branchId
 * @desc Get document requirements for a specific branch
 * @query stallholder_id - Optional: Include upload status for this stallholder
 * @access Public (should be protected in production)
 */
router.get('/documents/branch/:branchId', getBranchDocumentRequirements);

/**
 * @route POST /api/mobile/stallholder/documents/upload
 * @desc Upload a document for stallholder
 * @body stallholder_id, document_type_id, file
 * @access Public (should be protected in production)
 */
router.post('/documents/upload', upload.single('file'), uploadStallholderDocument);

export default router;
