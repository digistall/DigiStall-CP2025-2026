import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

import StallholderController from '../controllers/stallholders/stallholderController.js';
import DocumentController, { 
  getBranchDocumentRequirements,
  createBranchDocumentRequirement,
  setBranchDocumentRequirement,
  removeBranchDocumentRequirement,
  bulkUpdateDocumentRequirements,
  getAllDocumentTypes
} from '../controllers/stallholders/documentController.js';
import { authenticateToken } from '../middleware/enhancedAuth.js';

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ================================
// Stallholder Management Routes
// ================================

/**
 * @route GET /api/stallholders
 * @description Get all stallholders for the branch
 * @access Branch Manager, Employee
 */
router.get('/', authenticateToken, StallholderController.getAllStallholders);

/**
 * @route GET /api/stallholders/:id
 * @description Get specific stallholder by ID
 * @access Branch Manager, Employee
 */
router.get('/:id', authenticateToken, StallholderController.getStallholderById);

/**
 * @route POST /api/stallholders
 * @description Create new stallholder
 * @access Branch Manager
 */
router.post('/', authenticateToken, StallholderController.createStallholder);

/**
 * @route PUT /api/stallholders/:id
 * @description Update existing stallholder
 * @access Branch Manager
 */
router.put('/:id', authenticateToken, StallholderController.updateStallholder);

/**
 * @route DELETE /api/stallholders/:id
 * @description Delete/Terminate stallholder contract
 * @access Branch Manager
 */
router.delete('/:id', authenticateToken, StallholderController.deleteStallholder);

/**
 * @route GET /api/stallholders/data/available-stalls
 * @description Get available stalls for stallholder assignment
 * @access Branch Manager, Employee
 */
router.get('/data/available-stalls', authenticateToken, StallholderController.getAvailableStalls);

/**
 * @route POST /api/stallholders/import/excel
 * @description Import stallholders from Excel file
 * @access Branch Manager
 */
router.post('/import/excel', authenticateToken, upload.single('excelFile'), StallholderController.importFromExcel);

/**
 * @route GET /api/stallholders/excel/template
 * @description Download Excel template for stallholder import
 * @access Branch Manager
 */
router.get('/excel/template', authenticateToken, StallholderController.downloadExcelTemplate);

/**
 * @route POST /api/stallholders/excel/preview
 * @description Preview Excel file data before import
 * @access Branch Manager
 */
router.post('/excel/preview', authenticateToken, upload.single('file'), StallholderController.previewExcelData);

/**
 * @route POST /api/stallholders/excel/import
 * @description Import validated Excel data
 * @access Branch Manager
 */
router.post('/excel/import', authenticateToken, StallholderController.importExcelData);

// ================================
// Document Management Routes
// ================================

/**
 * @route GET /api/stallholders/documents/types
 * @description Get all available document types
 * @access Branch Manager, Employee
 */
router.get('/documents/types', authenticateToken, DocumentController.getAllDocumentTypes);

/**
 * @route GET /api/stallholders/documents/types-with-status
 * @description Get document types with current branch requirement status (Legacy - returns 501)
 * @access Branch Manager, Employee
 */
router.get('/documents/types-with-status', authenticateToken, DocumentController.getAllDocumentTypes);

/**
 * @route GET /api/stallholders/documents/requirements
 * @description Get document requirements for current branch
 * @access Branch Manager, Employee
 */
router.get('/documents/requirements', authenticateToken, getBranchDocumentRequirements);

/**
 * @route GET /api/stallholders/documents/requirements/:branchId
 * @description Get document requirements for specific branch
 * @access Branch Manager, Employee
 */
router.get('/documents/requirements/:branchId', authenticateToken, getBranchDocumentRequirements);

/**
 * @route POST /api/stallholders/documents/requirements
 * @description Create new document requirement for branch
 * @access Branch Manager
 */
router.post('/documents/requirements', authenticateToken, createBranchDocumentRequirement);

/**
 * @route PUT /api/stallholders/documents/requirements/:documentTypeId
 * @description Set/Update document requirement for branch
 * @access Branch Manager
 */
router.put('/documents/requirements/:documentTypeId', authenticateToken, setBranchDocumentRequirement);

/**
 * @route DELETE /api/stallholders/documents/requirements/:documentTypeId
 * @description Remove document requirement for branch
 * @access Branch Manager
 */
router.delete('/documents/requirements/:documentTypeId', authenticateToken, removeBranchDocumentRequirement);

/**
 * @route POST /api/stallholders/documents/requirements/bulk-update
 * @description Bulk update document requirements for branch
 * @access Branch Manager
 */
router.post('/documents/requirements/bulk-update', authenticateToken, bulkUpdateDocumentRequirements);

/**
 * @route GET /api/stallholders/documents/types
 * @description Get all available document types
 * @access Branch Manager, Employee
 */
router.get('/documents/types', authenticateToken, getAllDocumentTypes);

/**
 * @route POST /api/stallholders/documents/types
 * @description Create new document type
 * @access Admin
 */
router.post('/documents/types', authenticateToken, DocumentController.createDocumentType);

/**
 * @route PUT /api/stallholders/documents/types/:documentTypeId
 * @description Update existing document type
 * @access Admin
 */
router.put('/documents/types/:documentTypeId', authenticateToken, DocumentController.updateDocumentType);

/**
 * @route DELETE /api/stallholders/documents/types/:documentTypeId
 * @description Delete document type
 * @access Admin
 */
router.delete('/documents/types/:documentTypeId', authenticateToken, DocumentController.deleteDocumentType);

/**
 * @route GET /api/stallholders/:stallholderId/documents
 * @description Get documents for specific stallholder
 * @access Branch Manager, Employee
 */
router.get('/:stallholderId/documents', authenticateToken, DocumentController.getStallholderDocuments);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message === 'Only Excel files (.xlsx, .xls) are allowed!') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

export default router;