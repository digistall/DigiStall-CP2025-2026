import express from 'express';
import PaymentController from '../controllers/payments/paymentController_new.js';

const router = express.Router();

/**
 * Payment Routes - Complete Implementation
 * All routes use stored procedures for data integrity and performance
 */

// ============================================================================
// PAYMENT RETRIEVAL ROUTES
// ============================================================================

/**
 * GET /api/payments
 * Get all payments with filtering and pagination
 * Query params: branchId, paymentMethod, paymentStatus, startDate, endDate, limit, offset
 */
router.get('/', PaymentController.getAllPayments);

/**
 * GET /api/payments/summary
 * Get payment summary by branch and date range
 * Query params: branchId, startDate, endDate
 */
router.get('/summary', PaymentController.getPaymentSummary);

/**
 * GET /api/payments/statistics
 * Get payment statistics for reporting
 * Query params: branchId, year, month
 */
router.get('/statistics', PaymentController.getPaymentStatistics);

/**
 * GET /api/payments/pending
 * Get pending online payments requiring approval
 * Query params: branchId
 */
router.get('/pending', PaymentController.getPendingPayments);

/**
 * GET /api/payments/stallholder/:stallholderId
 * Get payment history for a specific stallholder
 * Params: stallholderId
 * Query params: limit
 */
router.get('/stallholder/:stallholderId', PaymentController.getStallholderPayments);

/**
 * GET /api/payments/stallholders
 * Get stallholders list for payment dropdown
 * Query params: search
 */
router.get('/stallholders', PaymentController.getStallholdersForPayment);

// ============================================================================
// PAYMENT CREATION ROUTES
// ============================================================================

/**
 * POST /api/payments/onsite
 * Add new onsite (cash) payment
 * Body: stallholderId, amount, paymentDate, paymentTime, paymentForMonth, paymentType, referenceNumber, collectedBy, notes
 */
router.post('/onsite', PaymentController.addOnsitePayment);

/**
 * POST /api/payments/online
 * Process new online payment
 * Body: stallholderId, amount, paymentDate, paymentTime, paymentForMonth, paymentType, referenceNumber, paymentGateway, transactionId, notes
 */
router.post('/online', PaymentController.processOnlinePayment);

// ============================================================================
// PAYMENT MANAGEMENT ROUTES
// ============================================================================

/**
 * PATCH /api/payments/:paymentId/accept
 * Accept/approve a pending online payment
 * Params: paymentId
 * Body: approvalNotes
 */
router.patch('/:paymentId/accept', PaymentController.acceptOnlinePayment);

/**
 * PATCH /api/payments/:paymentId/decline
 * Decline a pending online payment
 * Params: paymentId
 * Body: declineReason (required)
 */
router.patch('/:paymentId/decline', PaymentController.declineOnlinePayment);

/**
 * PATCH /api/payments/:paymentId/status
 * Update payment status
 * Params: paymentId
 * Body: status (pending|completed|failed|cancelled), reason
 */
router.patch('/:paymentId/status', PaymentController.updatePaymentStatus);

export default router;