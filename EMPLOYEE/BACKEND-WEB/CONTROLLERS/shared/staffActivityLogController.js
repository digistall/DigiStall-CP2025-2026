import { createConnection } from '../../config/database.js';

/**
 * Staff Activity Log Controller
 * Handles logging and retrieving activity for all staff types (web employees, inspectors, collectors)
 */

// Helper function to get Philippine time in MySQL format
const getPhilippineTime = () => {
  const now = new Date();
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = phTime.getFullYear();
  const month = String(phTime.getMonth() + 1).padStart(2, '0');
  const day = String(phTime.getDate()).padStart(2, '0');
  const hours = String(phTime.getHours()).padStart(2, '0');
  const minutes = String(phTime.getMinutes()).padStart(2, '0');
  const seconds = String(phTime.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Log staff activity
 * @param {Object} activityData - Activity data to log
 */
export async function logStaffActivity(activityData) {
    let connection;
    try {
        connection = await createConnection();
        
        const {
            staffType,
            staffId,
            staffName,
            branchId,
            actionType,
            actionDescription,
            module,
            ipAddress,
            userAgent,
            requestMethod,
            requestPath,
            status = 'success'
        } = activityData;

        // Use stored procedure for inserting activity log
        await connection.execute(
            'CALL sp_insertStaffActivityLog(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                staffType,
                staffId,
                staffName,
                branchId || null,
                actionType,
                actionDescription || null,
                module || null,
                ipAddress || null,
                userAgent || null,
                requestMethod || null,
                requestPath || null,
                status
            ]
        );

        console.log(`📝 Activity logged: ${staffType} - ${staffName} - ${actionType}`);
        return true;
    } catch (error) {
        console.error('❌ Error logging activity:', error);
        return false;
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Get all staff activities (for manager dashboard)
 * GET /api/activity-logs
 */
export async function getAllStaffActivities(req, res) {
    let connection;
    try {
        const branchId = req.query.branchId || req.user?.branchId || null;
        const staffType = req.query.staffType || null;
        const staffId = req.query.staffId ? parseInt(req.query.staffId) : null;
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        connection = await createConnection();

        // Use stored procedure for getting activities
        const [rows] = await connection.execute(
            'CALL sp_getAllStaffActivities(?, ?, ?, ?, ?, ?, ?)',
            [branchId, staffType, staffId, startDate, endDate, limit, offset]
        );
        const activities = rows[0];

        // Get total count using stored procedure
        const [countRows] = await connection.execute(
            'CALL sp_countStaffActivities(?, ?, ?, ?, ?)',
            [branchId, staffType, staffId, startDate, endDate]
        );
        const total = countRows[0][0].total;

        console.log(`✅ Found ${activities.length} activity logs`);

        res.json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + activities.length < total
            }
        });
    } catch (error) {
        console.error('❌ Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity logs',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Get activity logs for a specific staff member
 * GET /api/activity-logs/staff/:staffType/:staffId
 */
export async function getStaffActivityById(req, res) {
    let connection;
    try {
        const { staffType, staffId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        connection = await createConnection();

        // Use stored procedure for getting staff activities
        const [rows] = await connection.execute(
            'CALL sp_getStaffActivityById(?, ?, ?, ?)',
            [staffType, parseInt(staffId), limit, offset]
        );
        const activities = rows[0];

        // Get count using stored procedure
        const [countRows] = await connection.execute(
            'CALL sp_countStaffActivityById(?, ?)',
            [staffType, parseInt(staffId)]
        );
        const total = countRows[0][0].total;

        res.json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + activities.length < total
            }
        });
    } catch (error) {
        console.error('❌ Error fetching staff activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff activity',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Get activity summary/stats for dashboard
 * GET /api/activity-logs/summary
 */
export async function getActivitySummary(req, res) {
    let connection;
    try {
        const branchId = req.query.branchId || req.user?.branchId || null;
        const days = parseInt(req.query.days) || 7;

        connection = await createConnection();

        // Get activity counts by staff type using stored procedure
        const [typeRows] = await connection.execute(
            'CALL sp_getActivitySummaryByType(?, ?)',
            [branchId, days]
        );
        const byType = typeRows[0];

        // Get activity counts by action type using stored procedure
        const [actionRows] = await connection.execute(
            'CALL sp_getActivitySummaryByAction(?, ?)',
            [branchId, days]
        );
        const byAction = actionRows[0];

        // Get most active staff using stored procedure
        const [activeRows] = await connection.execute(
            'CALL sp_getMostActiveStaff(?, ?)',
            [branchId, days]
        );
        const mostActive = activeRows[0];

        // Get recent failed actions using stored procedure
        const [failedRows] = await connection.execute(
            'CALL sp_getRecentFailedActions(?, ?)',
            [branchId, days]
        );
        const failedActions = failedRows[0];

        res.json({
            success: true,
            data: {
                period: `${days} days`,
                byStaffType: byType,
                byActionType: byAction,
                mostActiveStaff: mostActive,
                recentFailedActions: failedActions
            }
        });
    } catch (error) {
        console.error('❌ Error fetching activity summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity summary',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Clear all activity logs
 * DELETE /api/activity-logs/clear-all
 */
export async function clearAllActivityLogs(req, res) {
    let connection;
    try {
        connection = await createConnection();
        
        // Delete all activity logs using stored procedure
        const [rows] = await connection.execute('CALL sp_clearAllActivityLogs()');
        const affectedRows = rows[0][0].affected_rows;

        console.log(`🗑️ Cleared ${affectedRows} activity log records`);

        // Log this action
        await logStaffActivity({
            staffType: req.user.userType || 'system_administrator',
            staffId: req.user.userId,
            staffName: req.user.username || `${req.user.firstName} ${req.user.lastName}`,
            branchId: req.user.branchId,
            actionType: 'DELETE',
            actionDescription: `Cleared all activity log history (${affectedRows} records)`,
            module: 'Activity Logs',
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            requestMethod: req.method,
            requestPath: req.originalUrl,
            status: 'success'
        });

        res.json({
            success: true,
            message: 'Activity log history cleared successfully',
            data: {
                recordsCleared: affectedRows
            }
        });
    } catch (error) {
        console.error('❌ Error clearing activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear activity logs',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Middleware to automatically log staff activities
 */
export function activityLogMiddleware(actionType, module) {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        
        res.json = async function(data) {
            // Log the activity after response is sent
            if (req.user) {
                const staffType = req.user.userType === 'business_employee' ? 'web_employee' : 
                                 req.user.staffType || req.user.userType;
                
                await logStaffActivity({
                    staffType: staffType === 'inspector' ? 'inspector' : 
                              staffType === 'collector' ? 'collector' : 'web_employee',
                    staffId: req.user.userId || req.user.staffId,
                    staffName: req.user.username || `${req.user.firstName} ${req.user.lastName}`,
                    branchId: req.user.branchId,
                    actionType: actionType,
                    actionDescription: `${req.method} ${req.originalUrl}`,
                    module: module,
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    requestMethod: req.method,
                    requestPath: req.originalUrl,
                    status: data.success ? 'success' : 'failed'
                });
            }
            
            return originalJson(data);
        };
        
        next();
    };
}

export default {
    logStaffActivity,
    getAllStaffActivities,
    getStaffActivityById,
    getActivitySummary,
    clearAllActivityLogs,
    activityLogMiddleware
};
