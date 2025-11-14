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
 * @route GET /api/payments/stats
 * @description Get payment statistics
 */
router.get('/stats', PaymentController.getPaymentStats);

/**
 * @route GET /api/payments/stallholders
 * @description Get stallholders list for payment dropdown (branch-filtered)
 */
router.get('/stallholders', 
  authorizePermission('payment'), 
  PaymentController.getStallholdersByBranch
);

/**
 * @route GET /api/payments/stallholders/:stallholderId
 * @description Get stallholder details for auto-population
 */
router.get('/stallholders/:stallholderId', PaymentController.getStallholderDetails);

/**
 * @route GET /api/payments/online
 * @description Get online payments
 */
router.get('/online', PaymentController.getOnlinePayments);

/**
 * @route GET /api/payments/onsite
 * @description Get onsite payments with filtering
 */
router.get('/onsite', PaymentController.getOnsitePayments);

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

export default router;