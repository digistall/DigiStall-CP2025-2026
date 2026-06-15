// =============================================
// VENDOR MOBILE ROUTES
// =============================================
// Routes for vendor mobile app (documents + payments)
// Base path: /api/mobile/vendor
// =============================================

import express from 'express'
import multer from 'multer'

import {
  uploadVendorDocumentBlob,
  getVendorDocuments,
  getVendorDocumentBlobById,
  getVendorDocumentBlobByIdBase64,
  getVendorDocumentRequirements,
  deleteVendorDocumentBlob
} from '../BACKEND/VENDOR/documents/vendorDocumentBlobController.js'

import VendorPaymentController from '../BACKEND/VENDOR/payments/vendorPaymentController.js'

const router = express.Router()

// In-memory multer for BLOB uploads (React Native FormData — no disk storage)
const blobUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, GIF images and PDF files are allowed'), false)
    }
  }
})

// =============================================
// VENDOR DOCUMENT ROUTES
// =============================================

/**
 * @route POST /api/mobile/vendor/documents/blob/upload
 * @desc Upload a vendor document as BLOB (multipart FormData or base64 JSON)
 * @body vendor_id, document_type_id, mime_type, file_name + file (multipart)
 */
router.post('/documents/blob/upload', blobUpload.single('file'), uploadVendorDocumentBlob)

/**
 * @route GET /api/mobile/vendor/documents/blob/id/:document_id
 * @desc Get vendor document BLOB by document ID (returns binary)
 * NOTE: Must come before /:vendor_id route to avoid param conflict
 */
router.get('/documents/blob/id/:document_id', getVendorDocumentBlobById)

/**
 * @route GET /api/mobile/vendor/documents/blob/base64/:document_id
 * @desc Get vendor document as base64 JSON (React Native compatible)
 */
router.get('/documents/blob/base64/:document_id', getVendorDocumentBlobByIdBase64)

/**
 * @route DELETE /api/mobile/vendor/documents/blob/:document_id
 * @desc Delete a vendor document
 */
router.delete('/documents/blob/:document_id', deleteVendorDocumentBlob)

/**
 * @route GET /api/mobile/vendor/documents/requirements/:vendor_id
 * @desc Get document requirements for a vendor (based on their branch)
 */
router.get('/documents/requirements/:vendor_id', getVendorDocumentRequirements)

/**
 * @route GET /api/mobile/vendor/documents/:vendor_id
 * @desc Get all uploaded documents for a vendor (metadata)
 * @query include_data=true to include base64 data
 * NOTE: This must be the LAST GET route to avoid catching more specific paths
 */
router.get('/documents/:vendor_id', getVendorDocuments)

// =============================================
// VENDOR PAYMENT HISTORY ROUTES
// =============================================

/**
 * @route GET /api/mobile/vendor/payments/summary/:vendorId
 * @desc Get payment summary/stats for a vendor (today, this month, all time)
 * NOTE: Must come before /payments/:vendorId to avoid param conflict
 */
router.get('/payments/summary/:vendorId', VendorPaymentController.getPaymentSummary)

/**
 * @route GET /api/mobile/vendor/payments/:vendorId
 * @desc Get paginated payment history for a vendor
 * @query { page, limit }
 */
router.get('/payments/:vendorId', VendorPaymentController.getMyPayments)

export default router
