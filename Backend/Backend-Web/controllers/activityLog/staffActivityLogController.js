import { createConnection } from '../../config/database.js';

/**
 * Staff Activity Log Controller
 * Handles logging and retrieving activity for all staff types (web employees, inspectors, collectors)
 */

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

        await connection.execute(`
            INSERT INTO staff_activity_log 
            (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
             module, ip_address, user_agent, request_method, request_path, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
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
        ]);

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
        const branchId = req.query.branchId || req.user?.branchId;
        const staffType = req.query.staffType; // Optional filter
        const staffId = req.query.staffId; // Optional filter
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        connection = await createConnection();

        let query = `
            SELECT 
                log_id,
                staff_type,
                staff_id,
                staff_name,
                branch_id,
                action_type,
                action_description,
                module,
                ip_address,
                status,
                created_at
            FROM staff_activity_log
            WHERE 1=1
        `;
        const params = [];

        // Filter by branch if provided
        if (branchId) {
            query += ` AND (branch_id = ? OR branch_id IS NULL)`;
            params.push(branchId);
        }

        // Filter by staff type
        if (staffType) {
            query += ` AND staff_type = ?`;
            params.push(staffType);
        }

        // Filter by staff ID
        if (staffId) {
            query += ` AND staff_id = ?`;
            params.push(staffId);
        }

        // Filter by date range
        if (startDate) {
            query += ` AND created_at >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND created_at <= ?`;
            params.push(endDate + ' 23:59:59');
        }

        // Embed LIMIT and OFFSET directly in query string to avoid mysql2 execute() issues
        query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        // Use query() instead of execute() for better mysql2 compatibility
        const [activities] = await connection.query(query, params);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM staff_activity_log WHERE 1=1`;
        const countParams = [];

        if (branchId) {
            countQuery += ` AND (branch_id = ? OR branch_id IS NULL)`;
            countParams.push(branchId);
        }
        if (staffType) {
            countQuery += ` AND staff_type = ?`;
            countParams.push(staffType);
        }
        if (staffId) {
            countQuery += ` AND staff_id = ?`;
            countParams.push(staffId);
        }
        if (startDate) {
            countQuery += ` AND created_at >= ?`;
            countParams.push(startDate);
        }
        if (endDate) {
            countQuery += ` AND created_at <= ?`;
            countParams.push(endDate + ' 23:59:59');
        }

        const [[{ total }]] = await connection.query(countQuery, countParams);

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

        // Use query() instead of execute() and embed LIMIT/OFFSET directly
        const [activities] = await connection.query(`
            SELECT 
                log_id,
                staff_type,
                staff_id,
                staff_name,
                branch_id,
                action_type,
                action_description,
                module,
                ip_address,
                status,
                created_at
            FROM staff_activity_log
            WHERE staff_type = ? AND staff_id = ?
            ORDER BY created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `, [staffType, staffId]);

        const [[{ total }]] = await connection.query(`
            SELECT COUNT(*) as total FROM staff_activity_log
            WHERE staff_type = ? AND staff_id = ?
        `, [staffType, staffId]);

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
        const branchId = req.query.branchId || req.user?.branchId;
        const days = parseInt(req.query.days) || 7;

        connection = await createConnection();

        // Get activity counts by staff type
        let typeQuery = `
            SELECT 
                staff_type,
                COUNT(*) as activity_count
            FROM staff_activity_log
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const typeParams = [days];

        if (branchId) {
            typeQuery += ` AND (branch_id = ? OR branch_id IS NULL)`;
            typeParams.push(branchId);
        }
        typeQuery += ` GROUP BY staff_type`;

        const [byType] = await connection.query(typeQuery, typeParams);

        // Get activity counts by action type
        let actionQuery = `
            SELECT 
                action_type,
                COUNT(*) as count
            FROM staff_activity_log
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const actionParams = [days];

        if (branchId) {
            actionQuery += ` AND (branch_id = ? OR branch_id IS NULL)`;
            actionParams.push(branchId);
        }
        actionQuery += ` GROUP BY action_type ORDER BY count DESC LIMIT 10`;

        const [byAction] = await connection.query(actionQuery, actionParams);

        // Get most active staff
        let activeQuery = `
            SELECT 
                staff_type,
                staff_id,
                staff_name,
                COUNT(*) as activity_count
            FROM staff_activity_log
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const activeParams = [days];

        if (branchId) {
            activeQuery += ` AND (branch_id = ? OR branch_id IS NULL)`;
            activeParams.push(branchId);
        }
        activeQuery += ` GROUP BY staff_type, staff_id, staff_name ORDER BY activity_count DESC LIMIT 10`;

        const [mostActive] = await connection.query(activeQuery, activeParams);

        // Get recent failed actions
        let failedQuery = `
            SELECT 
                staff_type,
                staff_name,
                action_type,
                action_description,
                created_at
            FROM staff_activity_log
            WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const failedParams = [days];

        if (branchId) {
            failedQuery += ` AND (branch_id = ? OR branch_id IS NULL)`;
            failedParams.push(branchId);
        }
        failedQuery += ` ORDER BY created_at DESC LIMIT 10`;

        const [failedActions] = await connection.query(failedQuery, failedParams);

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
    activityLogMiddleware
};
