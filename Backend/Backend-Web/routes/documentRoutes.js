import express from 'express';

// Import document controllers
import DocumentController, {
  getBranchDocumentRequirements,
  createBranchDocumentRequirement,
  setBranchDocumentRequirement,
  removeBranchDocumentRequirement,
  bulkUpdateDocumentRequirements,
  getAllDocumentTypes,
  getPendingDocumentSubmissions,
  getAllDocumentSubmissions,
  getDocumentSubmissionCounts,
  getDocumentSubmissionById,
  getDocumentSubmissionBlob,
  reviewDocumentSubmission,
  getStallholderDocumentSubmissions,
  reviewStallholderDocument,
  getStallholderDocumentFile,
  getStallholderDocumentBlob
} from '../controllers/stallholders/documentController.js';
import { authenticateToken } from '../middleware/enhancedAuth.js';

const router = express.Router();

// ===== PUBLIC DOCUMENT BLOB ROUTES (No Auth - for <img>/<iframe> direct access) =====
// These routes serve document blobs directly without authentication so they can be loaded in img/iframe tags
router.get('/blob/:documentId', getStallholderDocumentBlob);  // GET /api/documents/blob/:documentId - Serve document blob

// ===== PROTECTED ROUTES (Authentication Required) =====
router.use(authenticateToken);

// ================================
// Document Types Management
// ================================

/**
 * @route GET /api/documents/types
 * @description Get all available document types
 * @access Branch Manager, Employee
 */
router.get('/types', getAllDocumentTypes);

/**
 * @route POST /api/documents/types
 * @description Create new document type
 * @access Admin
 */
router.post('/types', DocumentController.createDocumentType);

/**
 * @route PUT /api/documents/types/:documentTypeId
 * @description Update existing document type
 * @access Admin
 */
router.put('/types/:documentTypeId', DocumentController.updateDocumentType);

/**
 * @route DELETE /api/documents/types/:documentTypeId
 * @description Delete document type
 * @access Admin
 */
router.delete('/types/:documentTypeId', DocumentController.deleteDocumentType);

// ================================
// Document Requirements Management
// ================================

/**
 * @route GET /api/documents/requirements
 * @description Get document requirements for current branch
 * @access Branch Manager, Employee, Business Owner
 */
router.get('/requirements', getBranchDocumentRequirements);

/**
 * @route GET /api/documents/requirements/:branchId
 * @description Get document requirements for specific branch
 * @access Branch Manager, Employee
 */
router.get('/requirements/:branchId', getBranchDocumentRequirements);

/**
 * @route POST /api/documents/requirements
 * @description Create new document requirement for branch
 * @access Branch Manager
 */
router.post('/requirements', createBranchDocumentRequirement);

/**
 * @route PUT /api/documents/requirements/:documentTypeId
 * @description Set/Update document requirement for branch
 * @access Branch Manager
 */
router.put('/requirements/:documentTypeId', setBranchDocumentRequirement);

/**
 * @route DELETE /api/documents/requirements/:documentTypeId
 * @description Remove document requirement for branch
 * @access Branch Manager
 */
router.delete('/requirements/:documentTypeId', removeBranchDocumentRequirement);

/**
 * @route POST /api/documents/requirements/bulk-update
 * @description Bulk update document requirements for branch
 * @access Branch Manager
 */
router.post('/requirements/bulk-update', bulkUpdateDocumentRequirements);

// ================================
// Document Submission Review Routes
// ================================

/**
 * @route GET /api/documents/submissions/pending
 * @description Get all pending document submissions for review
 * @access Branch Manager, Business Owner
 */
router.get('/submissions/pending', getPendingDocumentSubmissions);

/**
 * @route GET /api/documents/submissions
 * @description Get all document submissions with optional filtering
 * @query status - Filter by status (pending, approved, rejected, all)
 * @query page - Page number for pagination
 * @query limit - Number of items per page
 * @access Branch Manager, Business Owner
 */
router.get('/submissions', getAllDocumentSubmissions);

/**
 * @route GET /api/documents/submissions/counts
 * @description Get document submission counts by status (for dashboard)
 * @access Branch Manager, Business Owner
 */
router.get('/submissions/counts', getDocumentSubmissionCounts);

/**
 * @route GET /api/documents/submissions/:submissionId
 * @description Get specific document submission details
 * @access Branch Manager, Business Owner
 */
router.get('/submissions/:submissionId', getDocumentSubmissionById);

/**
 * @route GET /api/documents/submissions/:submissionId/blob
 * @description Get document submission file (BLOB/binary)
 * @access Branch Manager, Business Owner
 */
router.get('/submissions/:submissionId/blob', getDocumentSubmissionBlob);

/**
 * @route PUT /api/documents/submissions/:submissionId/review
 * @description Review (approve/reject) a document submission
 * @body status - 'approved' or 'rejected'
 * @body rejection_reason - Required if status is 'rejected'
 * @access Branch Manager, Business Owner
 */
router.put('/submissions/:submissionId/review', reviewDocumentSubmission);

// ================================
// Stallholder-Specific Document Routes
// ================================

/**
 * @route GET /api/documents/stallholder/:stallholderId/submissions
 * @description Get all document submissions for a specific stallholder
 * @access Branch Manager, Employee
 */
router.get('/stallholder/:stallholderId/submissions', getStallholderDocumentSubmissions);

/**
 * @route GET /api/documents/stallholder/:stallholderId/all
 * @description Get all documents for specific stallholder
 * @access Branch Manager, Employee
 */
router.get('/stallholder/:stallholderId/all', DocumentController.getStallholderDocuments);

/**
 * @route PUT /api/documents/:documentId/review
 * @description Review (approve/reject) a stallholder document
 * @access Branch Manager
 */
router.put('/:documentId/review', reviewStallholderDocument);

/**
 * @route GET /api/documents/:documentId/file
 * @description Get document file metadata for viewing/downloading
 * @access Branch Manager, Employee
 */
router.get('/:documentId/file', getStallholderDocumentFile);

export default router;
