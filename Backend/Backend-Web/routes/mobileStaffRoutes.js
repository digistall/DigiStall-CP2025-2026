import express from 'express';
import {
    createInspector,
    createCollector,
    getInspectorsByBranch,
    getCollectorsByBranch,
    terminateInspector,
    terminateCollector
} from '../controllers/mobileStaff/mobileStaffController.js';

const router = express.Router();

/**
 * Mobile Staff Management Routes
 * Routes for managing Inspector and Collector accounts for mobile app
 * Note: Authentication is applied at the mount point in server.js
 */

// ========================================
// INSPECTOR ROUTES
// ========================================

/**
 * @route   POST /api/mobile-staff/inspectors
 * @desc    Create new inspector account with auto-generated credentials
 * @access  Business Manager
 * @body    { firstName, lastName, email, phoneNumber, branchId, branchManagerId }
 */
router.post('/inspectors', createInspector);

/**
 * @route   GET /api/mobile-staff/inspectors
 * @desc    Get all inspectors for the current branch
 * @access  Business Manager
 */
router.get('/inspectors', getInspectorsByBranch);

/**
 * @route   DELETE /api/mobile-staff/inspectors/:id
 * @desc    Terminate/deactivate an inspector
 * @access  Business Manager
 * @params  id - Inspector ID
 * @body    { reason }
 */
router.delete('/inspectors/:id', terminateInspector);

// ========================================
// COLLECTOR ROUTES
// ========================================

/**
 * @route   POST /api/mobile-staff/collectors
 * @desc    Create new collector account with auto-generated credentials
 * @access  Business Manager
 * @body    { firstName, lastName, email, phoneNumber, branchId, branchManagerId }
 */
router.post('/collectors', createCollector);

/**
 * @route   GET /api/mobile-staff/collectors
 * @desc    Get all collectors for the current branch
 * @access  Business Manager
 */
router.get('/collectors', getCollectorsByBranch);

/**
 * @route   DELETE /api/mobile-staff/collectors/:id
 * @desc    Terminate/deactivate a collector
 * @access  Business Manager
 * @params  id - Collector ID
 * @body    { reason }
 */
router.delete('/collectors/:id', terminateCollector);

export default router;
