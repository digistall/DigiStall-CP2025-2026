import express from "express";
import CollectorPaymentController from "../BACKEND/COLLECTOR/collectorPaymentController.js";

const router = express.Router();

/**
 * Collector Mobile Routes
 * Routes for collector-specific mobile operations (QR scanning, payments)
 * Authentication is applied at the mount point in server.js
 */

// ============================================================================
// VENDOR QR LOOKUP
// ============================================================================

/**
 * @route GET /api/collector/vendors/qr/:vendorIdentifier
 * @desc  Lookup vendor by vendor_identifier (QR code scan result)
 * @access Authenticated collector
 */
router.get(
  "/vendors/qr/:vendorIdentifier",
  CollectorPaymentController.getVendorByIdentifier
);

// ============================================================================
// DAILY PAYMENTS
// ============================================================================

/**
 * @route POST /api/collector/daily-payments
 * @desc  Create a daily payment record (QR collection flow)
 * @access Authenticated collector
 * @body  { vendorId: number, amount: number }
 */
router.post(
  "/daily-payments",
  CollectorPaymentController.createDailyPayment
);

/**
 * @route GET /api/collector/daily-payments
 * @desc  Get collector's own payment history
 * @access Authenticated collector
 * @query { page, limit }
 */
router.get(
  "/daily-payments",
  CollectorPaymentController.getMyPayments
);

export default router;
