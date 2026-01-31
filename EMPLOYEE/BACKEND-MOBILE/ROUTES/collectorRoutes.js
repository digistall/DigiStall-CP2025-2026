import express from 'express';
import mobileAuthMiddleware from '../../../SHARED/MIDDLEWARE/mobileAuth.js';
import {
  getMobileStaffProfile,
  updateMobileStaffProfile,
  getMobileStaffDashboard,
  getCollectorDashboardStats,
  getCollectorPayments,
  recordPayment
} from '../CONTROLLERS/mobileStaff/mobileStaffController.js';

const router = express.Router();

/**
 * EMPLOYEE - Collector Mobile Routes
 * All routes for collector mobile operations
 */

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Profile
router.get('/profile', mobileAuthMiddleware, getMobileStaffProfile);
router.put('/profile', mobileAuthMiddleware, updateMobileStaffProfile);

// Dashboard
router.get('/dashboard', mobileAuthMiddleware, getCollectorDashboardStats);

// Payments
router.get('/payments', mobileAuthMiddleware, getCollectorPayments);
router.post('/payments/record', mobileAuthMiddleware, recordPayment);

export default router;
