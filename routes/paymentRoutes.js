import express from "express";
import PaymentController from "../SHARE-CONTROLLER/payments/paymentController.js";
import DailyPaymentController from "../SHARE-CONTROLLER/payments/dailyPaymentController.js";
import authMiddleware from "../middleware/auth.js";
import { viewOnlyForOwners } from "../middleware/rolePermissions.js";
import { authorizePermission } from "../middleware/enhancedAuth.js";

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
router.get(
  "/",
  authMiddleware.authenticateToken,
  PaymentController.getOnsitePayments
);

/**
 * @route GET /api/payments/stats
 * @description Get payment statistics
 */
router.get(
  "/stats",
  authMiddleware.authenticateToken,
  PaymentController.getPaymentStats
);

/**
 * @route GET /api/payments/stallholders
 * @description Get stallholders list for payment dropdown (branch-filtered)
 */
router.get(
  "/stallholders",
  authMiddleware.authenticateToken,
  PaymentController.getStallholdersByBranch
);

/**
 * @route GET /api/payments/stallholders/:stallholderId
 * @description Get stallholder details for auto-population
 */
router.get(
  "/stallholders/:stallholderId",
  authMiddleware.authenticateToken,
  PaymentController.getStallholderDetails
);

/**
 * @route GET /api/payments/online
 * @description Get online payments
 */
router.get(
  "/online",
  authMiddleware.authenticateToken,
  PaymentController.getOnlinePayments
);

/**
 * @route GET /api/payments/onsite
 * @description Get onsite payments with filtering
 */
router.get(
  "/onsite",
  authMiddleware.authenticateToken,
  PaymentController.getOnsitePayments
);

/**
 * @route GET /api/payments/generate-receipt-number
 * @description Generate new receipt number for onsite payment
 */
router.get(
  "/generate-receipt-number",
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
router.post(
  "/onsite",
  authMiddleware.authenticateToken,
  viewOnlyForOwners,
  PaymentController.addOnsitePayment
);

// ============================================================================
// VIOLATION PAYMENT ROUTES
// ============================================================================

/**
 * @route GET /api/payments/violations/unpaid/:stallholderId
 * @description Get unpaid violations for a stallholder
 */
router.get(
  "/violations/unpaid/:stallholderId",
  authMiddleware.authenticateToken,
  PaymentController.getUnpaidViolations
);

/**
 * @route POST /api/payments/violations/pay
 * @description Process payment for a violation
 */
router.post(
  "/violations/pay",
  authMiddleware.authenticateToken,
  viewOnlyForOwners,
  PaymentController.processViolationPayment
);

/**
 * @route GET /api/payments/penalty
 * @description Get penalty payments (from penalty_payments table)
 */
router.get(
  "/penalty",
  authMiddleware.authenticateToken,
  PaymentController.getPenaltyPayments
);

// ============================================================================
// DAILY PAYMENT ROUTES
// ============================================================================

/**
 * @route GET /api/payments/daily/vendors
 * @description Get all active vendors for dropdown
 */
router.get(
  "/daily/vendors",
  authMiddleware.authenticateToken,
  DailyPaymentController.getAllVendors
);

/**
 * @route GET /api/payments/daily/collectors
 * @description Get all active collectors for dropdown
 */
router.get(
  "/daily/collectors",
  authMiddleware.authenticateToken,
  DailyPaymentController.getAllCollectors
);

/**
 * @route GET /api/payments/daily
 * @description Get all daily payments
 */
router.get(
  "/daily",
  authMiddleware.authenticateToken,
  DailyPaymentController.getAllDailyPayments
);

/**
 * @route GET /api/payments/daily/:receiptId
 * @description Get a single daily payment by receipt ID
 */
router.get(
  "/daily/:receiptId",
  authMiddleware.authenticateToken,
  DailyPaymentController.getDailyPaymentById
);

/**
 * @route POST /api/payments/daily
 * @description Add a new daily payment
 */
router.post(
  "/daily",
  authMiddleware.authenticateToken,
  viewOnlyForOwners,
  DailyPaymentController.addDailyPayment
);

/**
 * @route PUT /api/payments/daily/:receiptId
 * @description Update an existing daily payment
 */
router.put(
  "/daily/:receiptId",
  authMiddleware.authenticateToken,
  viewOnlyForOwners,
  DailyPaymentController.updateDailyPayment
);

/**
 * @route DELETE /api/payments/daily/:receiptId
 * @description Delete a daily payment
 */
router.delete(
  "/daily/:receiptId",
  authMiddleware.authenticateToken,
  viewOnlyForOwners,
  DailyPaymentController.deleteDailyPayment
);

export default router;
