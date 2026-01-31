import express from 'express';
import mobileAuthMiddleware from '../../../SHARED/MIDDLEWARE/mobileAuth.js';
import {
  getStallholdersByInspectorBranch,
  getStallsByInspectorBranch,
  getStallDetails,
  getStallholderDetails,
  reportViolation,
  getViolationTypes,
  getInspectorViolations,
  getInspectorDashboardStats
} from '../CONTROLLERS/inspector/inspectorController.js';

const router = express.Router();

/**
 * EMPLOYEE - Inspector Mobile Routes
 * All routes for inspector mobile operations
 */

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Dashboard
router.get('/dashboard', mobileAuthMiddleware, getInspectorDashboardStats);

// Stallholders
router.get('/stallholders', mobileAuthMiddleware, getStallholdersByInspectorBranch);
router.get('/stallholders/:id', mobileAuthMiddleware, getStallholderDetails);

// Stalls
router.get('/stalls', mobileAuthMiddleware, getStallsByInspectorBranch);
router.get('/stalls/:id', mobileAuthMiddleware, getStallDetails);

// Violations
router.get('/violations', mobileAuthMiddleware, getInspectorViolations);
router.get('/violation-types', mobileAuthMiddleware, getViolationTypes);
router.post('/violations/report', mobileAuthMiddleware, reportViolation);

export default router;
