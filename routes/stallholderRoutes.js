import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStallholderStallsWithDocuments,
  getBranchDocumentRequirements,
  uploadStallholderDocument
} from '../CONTROLLERS/user/stallholderDocumentController.js';

// Import BLOB document controller for cloud storage
import {
  uploadStallholderDocumentBlob,
  uploadStallholderDocumentSubmissionBlob,
  getStallholderDocumentBlob,
  getStallholderDocumentBlobById,
  getStallholderDocumentBlobByIdBase64,
  getStallholderDocumentSubmissionBlob,
  getStallholderDocuments,
  deleteStallholderDocumentBlob,
  updateStallholderDocumentVerificationStatus
} from '../CONTROLLERS/documents/stallholderDocumentBlobController.js';

// Import complaint controller
import {
  submitComplaint,
  getMyComplaints
} from '../CONTROLLERS/stallholder/complaintController.js';

// Import profile controller
import {
  getStallholderProfile
} from '../CONTROLLERS/stallholder/profileController.js';

// Import payment controller
import {
  getPaymentRecords,
  getAllPaymentRecords,
  getPaymentSummary
} from '../CONTROLLERS/stallholder/paymentController.js';

// Import auth middleware
import { verifyToken } from '../MIDDLEWARE/auth.js';

const router = express.Router();

// Get directory path for uploads
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
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
 * @route GET /api/mobile/stallholder/documents/branch/:branchId
 * @desc Get document requirements for a specific branch
 * @query stallholder_id - Optional: Include upload status for this stallholder
 * @access Public (should be protected in production)
 */
router.get('/documents/branch/:branchId', getBranchDocumentRequirements);

/**
 * @route GET /api/mobile/stallholder/documents/:applicantId
 * @desc Get all stalls owned by stallholder with document requirements grouped by branch
 * @access Public (should be protected in production)
 */
router.get('/documents/:applicantId', getStallholderStallsWithDocuments);

/**
 * @route POST /api/mobile/stallholder/documents/upload
 * @desc Upload a document for stallholder
 * @body stallholder_id, document_type_id, file
 * @access Public (should be protected in production)
 */
router.post('/documents/upload', upload.single('file'), uploadStallholderDocument);

// =============================================
// STALLHOLDER DOCUMENT BLOB ROUTES (Cloud Storage)
// =============================================

/**
 * @route POST /api/mobile/stallholder/documents/blob/upload
 * @desc Upload document as BLOB (base64) to cloud database
 * @body stallholder_id, document_type_id, document_data (base64), mime_type, file_name
 */
router.post('/documents/blob/upload', uploadStallholderDocumentBlob);

/**
 * @route POST /api/mobile/stallholder/documents/submission/blob/upload
 * @desc Upload document submission as BLOB for document_submissions table
 * @body stallholder_id, owner_id, requirement_id, document_data (base64), mime_type, file_name
 */
router.post('/documents/submission/blob/upload', uploadStallholderDocumentSubmissionBlob);

/**
 * @route GET /api/mobile/stallholder/documents/blob/id/:document_id
 * @desc Get document BLOB by document ID (returns binary)
 * NOTE: This route MUST come before /documents/blob/:stallholder_id/:document_type_id
 */
router.get('/documents/blob/id/:document_id', getStallholderDocumentBlobById);

/**
 * @route GET /api/mobile/stallholder/documents/blob/base64/:document_id
 * @desc Get document BLOB as base64 JSON (React Native compatible)
 * NOTE: This route MUST come before /documents/blob/:stallholder_id/:document_type_id
 */
router.get('/documents/blob/base64/:document_id', getStallholderDocumentBlobByIdBase64);

/**
 * @route GET /api/mobile/stallholder/documents/blob/:stallholder_id/:document_type_id
 * @desc Get document BLOB by stallholder and document type (returns binary)
 * NOTE: This route MUST come after more specific /documents/blob/id/ and /documents/blob/base64/ routes
 */
router.get('/documents/blob/:stallholder_id/:document_type_id', getStallholderDocumentBlob);

/**
 * @route GET /api/mobile/stallholder/documents/submission/blob/:submission_id
 * @desc Get document submission BLOB (returns binary)
 */
router.get('/documents/submission/blob/:submission_id', getStallholderDocumentSubmissionBlob);

/**
 * @route GET /api/mobile/stallholder/:stallholder_id/documents/blob
 * @desc Get all documents for stallholder (returns metadata with optional base64)
 * @query include_data=true to include base64 data
 */
router.get('/:stallholder_id/documents/blob', getStallholderDocuments);

/**
 * @route DELETE /api/mobile/stallholder/documents/blob/:document_id
 * @desc Delete document BLOB
 */
router.delete('/documents/blob/:document_id', deleteStallholderDocumentBlob);

/**
 * @route PUT /api/mobile/stallholder/documents/blob/:document_id/verify
 * @desc Update document verification status
 */
router.put('/documents/blob/:document_id/verify', updateStallholderDocumentVerificationStatus);

// =============================================
// STALLHOLDER COMPLAINT ROUTES
// =============================================

/**
 * @route GET /api/mobile/stallholder/profile/:stallholder_id
 * @desc Get stallholder profile with stall information
 * @access Protected (Stallholder only)
 */
router.get('/profile/:stallholder_id', verifyToken, getStallholderProfile);

/**
 * @route POST /api/mobile/stallholder/complaint
 * @desc Submit a complaint
 * @access Protected (Stallholder only)
 */
router.post('/complaint', verifyToken, submitComplaint);

/**
 * @route GET /api/mobile/stallholder/complaints
 * @desc Get stallholder's complaints
 * @access Protected (Stallholder only)
 */
router.get('/complaints', verifyToken, getMyComplaints);

// =============================================
// STALLHOLDER PAYMENT ROUTES
// =============================================

/**
 * @route GET /api/mobile/stallholder/payments
 * @desc Get payment records for stallholder (paginated)
 * @query page - Page number (default: 1)
 * @query limit - Records per page (default: 10)
 * @access Protected (Stallholder only)
 */
router.get('/payments', verifyToken, getPaymentRecords);

/**
 * @route GET /api/mobile/stallholder/payments/all
 * @desc Get all payment records for stallholder (no pagination)
 * @access Protected (Stallholder only)
 */
router.get('/payments/all', verifyToken, getAllPaymentRecords);

/**
 * @route GET /api/mobile/stallholder/payments/summary
 * @desc Get payment summary/statistics for stallholder
 * @access Protected (Stallholder only)
 */
router.get('/payments/summary', verifyToken, getPaymentSummary);

export default router;
