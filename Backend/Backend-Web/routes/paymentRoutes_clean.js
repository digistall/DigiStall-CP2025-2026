import express from 'express';
import PaymentController from '../controllers/payments/paymentController.js';
import authMiddleware from '../middleware/auth.js';
import { authorizePermission } from '../middleware/enhancedAuth.js';

const router = express.Router();

/**
 * Payment Routes - Clean Implementation
 * All routes require authentication and payment permissions
 */

// ============================================================================
// GET ROUTES
// ============================================================================

/**
 * @route GET /api/payments
 * @description Get all payments with filtering options
 */
router.get('/', PaymentController.getAllPayments);

/**
 * @route GET /api/payments/summary
 * @description Get payment summary for reporting
 */
router.get('/summary', PaymentController.getPaymentSummary);

/**
 * @route GET /api/payments/statistics
 * @description Get payment statistics
 */
router.get('/statistics', PaymentController.getPaymentStatistics);

/**
 * @route GET /api/payments/pending
 * @description Get pending online payments
 */
router.get('/pending', PaymentController.getPendingPayments);

/**
 * @route GET /api/payments/stallholder/:stallholderId
 * @description Get payment history for a specific stallholder
 */
router.get('/stallholder/:stallholderId', PaymentController.getStallholderPayments);

/**
 * @route GET /api/payments/stallholders
 * @description Get stallholders list for payment dropdown
 */
router.get('/stallholders', 
  authorizePermission('payment'), 
  PaymentController.getStallholdersForPayment
);

// ============================================================================
// POST ROUTES
// ============================================================================

/**
 * @route POST /api/payments/onsite
 * @description Create new onsite payment record
 */
router.post('/onsite', 
  authorizePermission('payments'),
  PaymentController.addOnsitePayment
);

/**
 * @route POST /api/payments/online
 * @description Process new online payment
 */
router.post('/online', 
  authorizePermission('payments'),
  PaymentController.processOnlinePayment
);

// ============================================================================
// PATCH ROUTES
// ============================================================================

/**
 * @route PATCH /api/payments/:paymentId/accept
 * @description Accept/approve a pending online payment
 */
router.patch('/:paymentId/accept', 
  authorizePermission('payments'),
  PaymentController.acceptOnlinePayment
);

/**
 * @route PATCH /api/payments/:paymentId/decline
 * @description Decline a pending online payment
 */
router.patch('/:paymentId/decline', 
  authorizePermission('payments'),
  PaymentController.declineOnlinePayment
);

/**
 * @route PATCH /api/payments/:paymentId/status
 * @description Update payment status
 */
router.patch('/:paymentId/status', 
  authorizePermission('payments'),
  PaymentController.updatePaymentStatus
);

export default router;