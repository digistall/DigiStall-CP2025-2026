import express from 'express';
import PaymentController from '../controllers/payments/paymentController.js';
import authMiddleware from '../middleware/auth.js';
import { viewOnlyForOwners } from '../middleware/rolePermissions.js';
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
 * @description Get all onsite payments (redirects to /onsite)
 */
router.get('/', 
  authMiddleware.authenticateToken,
  PaymentController.getOnsitePayments
);

/**
 * @route GET /api/payments/stats
 * @description Get payment statistics
 */
router.get('/stats', 
  authMiddleware.authenticateToken,
  PaymentController.getPaymentStats
);

/**
 * @route GET /api/payments/stallholders
 * @description Get stallholders list for payment dropdown (branch-filtered)
 */
router.get('/stallholders', 
  authMiddleware.authenticateToken,
  PaymentController.getStallholdersByBranch
);

/**
 * @route GET /api/payments/stallholders/:stallholderId
 * @description Get stallholder details for auto-population
 */
router.get('/stallholders/:stallholderId', 
  authMiddleware.authenticateToken,
  PaymentController.getStallholderDetails
);

/**
 * @route GET /api/payments/online
 * @description Get online payments
 */
router.get('/online', 
  authMiddleware.authenticateToken,
  PaymentController.getOnlinePayments
);

/**
 * @route GET /api/payments/onsite
 * @description Get onsite payments with filtering
 */
router.get('/onsite', 
  authMiddleware.authenticateToken,
  PaymentController.getOnsitePayments
);

/**
 * @route GET /api/payments/generate-receipt-number
 * @description Generate new receipt number for onsite payment
 */
router.get('/generate-receipt-number', 
  authMiddleware.authenticateToken,
  PaymentController.generateReceiptNumber
);

// ============================================================================
// POST ROUTES
// ============================================================================

/**
 * @route POST /api/payments/onsite
 * @description Create new onsite payment record
 */
router.post('/onsite', 
  authMiddleware.authenticateToken,
  viewOnlyForOwners,
  PaymentController.addOnsitePayment
);

export default router;