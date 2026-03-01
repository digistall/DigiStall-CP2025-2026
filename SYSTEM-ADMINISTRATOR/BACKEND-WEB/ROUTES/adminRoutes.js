import express from 'express';
import authMiddleware from '../../../SHARED/MIDDLEWARE/auth.js';
import {
  getDashboardStats,
  getAllUsers,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings
} from '../CONTROLLERS/adminController.js';

const router = express.Router();

/**
 * SYSTEM-ADMINISTRATOR - Admin Routes
 * All routes for system administration
 */

// ========================================
// PROTECTED ROUTES (Admin authentication required)
// ========================================

// Dashboard
router.get('/dashboard', authMiddleware, getDashboardStats);

// User Management
router.get('/users', authMiddleware, getAllUsers);

// Activity Logs
router.get('/activity-logs', authMiddleware, getActivityLogs);

// System Settings
router.get('/settings', authMiddleware, getSystemSettings);
router.put('/settings', authMiddleware, updateSystemSettings);

export default router;
