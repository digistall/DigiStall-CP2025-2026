import express from 'express';
import { 
    getAllStaffActivities, 
    getStaffActivityById, 
    getActivitySummary,
    clearAllActivityLogs
} from '../../SHARE-CONTROLLER/activityLog/staffActivityLogController.js';
import { authenticateToken, authorizeRole } from '../../middleware/enhancedAuth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/activity-logs
 * @desc Get all staff activity logs
 * @access Private (Manager/Admin only)
 */
router.get('/', authorizeRole('system_administrator', 'business_manager', 'business_owner'), getAllStaffActivities);

/**
 * @route GET /api/activity-logs/summary
 * @desc Get activity summary/stats for dashboard
 * @access Private (Manager/Admin only)
 */
router.get('/summary', authorizeRole('system_administrator', 'business_manager', 'business_owner'), getActivitySummary);

/**
 * @route DELETE /api/activity-logs/clear-all
 * @desc Clear all activity log history
 * @access Private (Admin/Manager only)
 */
router.delete('/clear-all', authorizeRole('system_administrator', 'business_manager', 'business_owner'), clearAllActivityLogs);

/**
 * @route GET /api/activity-logs/staff/:staffType/:staffId
 * @desc Get activity logs for a specific staff member
 * @access Private (Manager/Admin only)
 */
router.get('/staff/:staffType/:staffId', authorizeRole('system_administrator', 'business_manager', 'business_owner'), getStaffActivityById);

export default router;
