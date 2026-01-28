import express from 'express';
import mobileAuthMiddleware from '../../../SHARED/MIDDLEWARE/mobileAuth.js';
import {
  getStallholderProfile,
  updateStallholderProfile
} from '../CONTROLLERS/profileController.js';
import {
  getStallholderStalls,
  getStallDetails
} from '../CONTROLLERS/stallController.js';
import {
  getPaymentHistory,
  getPaymentDetails,
  getUpcomingPayments
} from '../CONTROLLERS/paymentController.js';
import {
  submitComplaint,
  getComplaintHistory,
  getComplaintDetails
} from '../CONTROLLERS/complaintController.js';
import {
  uploadDocument,
  getDocuments,
  deleteDocument
} from '../CONTROLLERS/stallholderDocumentController.js';

const router = express.Router();

/**
 * STALL-HOLDER - Mobile Backend Routes
 * All routes for stallholder mobile operations
 */

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Profile
router.get('/profile/:stallholder_id', mobileAuthMiddleware, getStallholderProfile);
router.put('/profile/:stallholder_id', mobileAuthMiddleware, updateStallholderProfile);

// Stalls
router.get('/stalls', mobileAuthMiddleware, getStallholderStalls);
router.get('/stalls/:id', mobileAuthMiddleware, getStallDetails);

// Payments
router.get('/payments', mobileAuthMiddleware, getPaymentHistory);
router.get('/payments/:id', mobileAuthMiddleware, getPaymentDetails);
router.get('/payments/upcoming', mobileAuthMiddleware, getUpcomingPayments);

// Complaints
router.post('/complaints', mobileAuthMiddleware, submitComplaint);
router.get('/complaints', mobileAuthMiddleware, getComplaintHistory);
router.get('/complaints/:id', mobileAuthMiddleware, getComplaintDetails);

// Documents
router.post('/documents', mobileAuthMiddleware, uploadDocument);
router.get('/documents', mobileAuthMiddleware, getDocuments);
router.delete('/documents/:id', mobileAuthMiddleware, deleteDocument);

export default router;
