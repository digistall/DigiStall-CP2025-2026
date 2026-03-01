import express from 'express';
import authMiddleware from '../../../../SHARED/MIDDLEWARE/auth.js';
import {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats
} from '../CONTROLLERS/branch/branchController.js';
import {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getDashboardSubscriptions
} from '../CONTROLLERS/subscriptions/subscriptionController.js';

const router = express.Router();

/**
 * BUSINESS - Owner/Manager Web Routes
 * All routes for business owner/manager operations
 */

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Branch Management
router.get('/branches', authMiddleware, getAllBranches);
router.get('/branches/:id', authMiddleware, getBranchById);
router.post('/branches', authMiddleware, createBranch);
router.put('/branches/:id', authMiddleware, updateBranch);
router.delete('/branches/:id', authMiddleware, deleteBranch);
router.get('/branches/:id/stats', authMiddleware, getBranchStats);

// Subscription Management
router.get('/subscriptions', authMiddleware, getAllSubscriptions);
router.get('/subscriptions/:id', authMiddleware, getSubscriptionById);
router.post('/subscriptions', authMiddleware, createSubscription);
router.put('/subscriptions/:id', authMiddleware, updateSubscription);
router.delete('/subscriptions/:id', authMiddleware, cancelSubscription);
router.get('/subscriptions/dashboard', authMiddleware, getDashboardSubscriptions);

export default router;
