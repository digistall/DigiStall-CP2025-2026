// ===== SUBSCRIPTION MANAGEMENT ROUTES =====
// Routes for managing subscriptions (System Administrator and Business Owners)

import express from 'express';
import authMiddleware from '../MIDDLEWARE/auth.js';
import {
  getAllSubscriptionPlans,
  createBusinessOwnerWithSubscription,
  recordSubscriptionPayment,
  getAllBusinessOwnersWithSubscription,
  getBusinessOwnerSubscription,
  getBusinessOwnerPaymentHistory,
  getSystemAdminDashboardStats
} from '../CONTROLLERS/subscriptions/subscriptionController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// ===== BUSINESS OWNER ROUTES (view own subscription and change plans) =====

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all subscription plans (available to business owners for selection)
 * @access  Business Owner, System Administrator
 */
router.get('/plans', getAllSubscriptionPlans);

/**
 * @route   GET /api/subscriptions/my-subscription
 * @desc    Get current user's subscription details
 * @access  Business Owner
 */
router.get('/my-subscription', async (req, res, next) => {
  // Get business owner ID from authenticated user
  req.params.businessOwnerId = req.user?.userId || req.user?.business_owner_id || req.user?.businessOwnerId;
  next();
}, getBusinessOwnerSubscription);

/**
 * @route   GET /api/subscriptions/my-payment-history
 * @desc    Get current user's payment history
 * @access  Business Owner
 */
router.get('/my-payment-history', async (req, res, next) => {
  // Get business owner ID from authenticated user
  req.params.businessOwnerId = req.user?.userId || req.user?.business_owner_id || req.user?.businessOwnerId;
  next();
}, getBusinessOwnerPaymentHistory);

/**
 * @route   POST /api/subscriptions/change-plan
 * @desc    Change subscription plan for current user
 * @access  Business Owner
 */
router.post('/change-plan', async (req, res) => {
  try {
    const businessOwnerId = req.user?.userId || req.user?.business_owner_id || req.user?.businessOwnerId;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }
    
    // Import createConnection here to avoid circular dependency
    const { createConnection } = await import('../../CONFIG/database.js');
    const connection = await createConnection();
    
    try {
      // Update subscription plan
      const [result] = await connection.execute(
        `UPDATE business_owner_subscription 
         SET plan_id = ?, 
             updated_at = NOW()
         WHERE business_owner_id = ?`,
        [planId, businessOwnerId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Subscription plan updated successfully'
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error changing subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change subscription plan',
      error: error.message
    });
  }
});

// ===== SYSTEM ADMINISTRATOR ROUTES =====
// Apply System Administrator authentication to routes below
router.use(authMiddleware.authenticateSystemAdministrator);

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
