// ===== SUBSCRIPTION MANAGEMENT ROUTES =====
// System Administrator only routes for managing subscriptions

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getAllSubscriptionPlans,
  createBusinessOwnerWithSubscription,
  recordSubscriptionPayment,
  getAllBusinessOwnersWithSubscription,
  getBusinessOwnerSubscription,
  getBusinessOwnerPaymentHistory,
  getSystemAdminDashboardStats
} from '../controllers/subscriptions/subscriptionController.js';

const router = express.Router();

// Apply authentication middleware - System Administrator only
router.use(authMiddleware.authenticateToken);
router.use(authMiddleware.authenticateSystemAdministrator);

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all subscription plans
 * @access  System Administrator
 */
router.get('/plans', getAllSubscriptionPlans);

/**
 * @route   POST /api/subscriptions/business-owner
 * @desc    Create new Business Owner with subscription
 * @access  System Administrator
 * @body    { username, password, firstName, lastName, email, contactNumber, planId }
 */
router.post('/business-owner', createBusinessOwnerWithSubscription);

/**
 * @route   GET /api/subscriptions/business-owners
 * @desc    Get all Business Owners with subscription status
 * @access  System Administrator
 */
router.get('/business-owners', getAllBusinessOwnersWithSubscription);

/**
 * @route   GET /api/subscriptions/business-owner/:businessOwnerId
 * @desc    Get Business Owner subscription details
 * @access  System Administrator
 */
router.get('/business-owner/:businessOwnerId', getBusinessOwnerSubscription);

/**
 * @route   POST /api/subscriptions/payment
 * @desc    Record subscription payment
 * @access  System Administrator
 * @body    { subscriptionId, businessOwnerId, amount, paymentDate, paymentMethod, referenceNumber, periodStart, periodEnd, notes }
 */
router.post('/payment', recordSubscriptionPayment);

/**
 * @route   GET /api/subscriptions/payment-history/:businessOwnerId
 * @desc    Get payment history for a Business Owner
 * @access  System Administrator
 */
router.get('/payment-history/:businessOwnerId', getBusinessOwnerPaymentHistory);

/**
 * @route   GET /api/subscriptions/dashboard-stats
 * @desc    Get dashboard statistics for System Administrator
 * @access  System Administrator
 */
router.get('/dashboard-stats', getSystemAdminDashboardStats);

export default router;
