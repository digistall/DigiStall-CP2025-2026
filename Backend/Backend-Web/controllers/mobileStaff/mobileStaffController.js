import { createConnection } from '../../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Mobile Staff Controller
 * Handles creation and management of Inspector and Collector accounts
 * These accounts are used for mobile app login only
 */

// Generate unique username for mobile staff
const generateMobileUsername = (role, id) => {
    const prefix = role === 'inspector' ? 'INS' : 'COL';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomDigits}`;
};

// Generate secure password
const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

/**
 * Create a new Inspector account
 * POST /api/mobile-staff/inspectors
 */
export async function createInspector(req, res) {
    let connection;
    try {
        const { firstName, lastName, email, phoneNumber, branchId, branchManagerId } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, email'
            });
        }

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }

        connection = await createConnection();

        // Check if email already exists using stored procedure
        const [existingResult] = await connection.execute(
            'CALL sp_checkInspectorEmailExists(?)',
            [email]
        );

        if (existingResult[0] && existingResult[0].length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An inspector with this email already exists'
            });
        }

        // Generate credentials
        const username = generateMobileUsername('inspector');
        const password = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log(`📱 Creating inspector: ${firstName} ${lastName} (${username})`);

        // Create inspector using stored procedure
        const [insertResult] = await connection.execute(
            'CALL sp_createInspectorDirect(?, ?, ?, ?, ?, ?)',
            [username, firstName, lastName, email, hashedPassword, phoneNumber || null]
        );

        const inspectorId = insertResult[0]?.[0]?.inspector_id;
        console.log(`✅ Inspector created with ID: ${inspectorId}`);

        // Create assignment using stored procedure
        await connection.execute(
            'CALL sp_createInspectorAssignmentDirect(?, ?, ?)',
            [inspectorId, branchId, 'Newly hired inspector']
        );
        console.log(`✅ Inspector assignment created for branch ${branchId}`);

        // Log the action using stored procedure
        try {
            await connection.execute(
                'CALL sp_logInspectorAction(?, ?, ?, ?, ?)',
                [inspectorId, branchId, branchManagerId, 'New Hire', `Inspector ${firstName} ${lastName} was hired`]
            );
        } catch (logError) {
            console.log('⚠️ Could not log action:', logError.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Inspector created successfully',
            data: {
                inspectorId,
                credentials: {
                    username,
                    password
                },
                branchId
            }
        });
    } catch (error) {
        console.error('❌ Error creating inspector:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create inspector',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Create a new Collector account
 * POST /api/mobile-staff/collectors
 */
export async function createCollector(req, res) {
    let connection;
    try {
        const { firstName, lastName, email, phoneNumber, branchId, branchManagerId } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, email'
            });
        }

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID is required'
            });
        }

        connection = await createConnection();

        // Check if collector table exists using stored procedure
        const [tableResult] = await connection.execute('CALL sp_checkCollectorTableExists()');

        if (!tableResult[0] || tableResult[0].length === 0) {
            // Collector table does not exist, create it
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS collector (
                    collector_id INT NOT NULL AUTO_INCREMENT,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    middle_name VARCHAR(100) DEFAULT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    contact_no VARCHAR(20) DEFAULT NULL,
                    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
                    date_hired DATE DEFAULT (CURDATE()),
                    status ENUM('active','inactive') DEFAULT 'active',
                    termination_date DATE DEFAULT NULL,
                    termination_reason VARCHAR(255) DEFAULT NULL,
                    last_login TIMESTAMP NULL DEFAULT NULL,
                    last_logout TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (collector_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);

            // Also create collector_assignment and collector_action_log tables
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS collector_assignment (
                    assignment_id INT NOT NULL AUTO_INCREMENT,
                    collector_id INT NOT NULL,
                    branch_id INT NOT NULL,
                    start_date DATE DEFAULT (CURDATE()),
                    end_date DATE DEFAULT NULL,
                    status ENUM('Active','Inactive','Transferred') DEFAULT 'Active',
                    remarks TEXT DEFAULT NULL,
                    PRIMARY KEY (assignment_id),
                    KEY fk_collector_assignment (collector_id),
                    KEY fk_collector_branch (branch_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);

            await connection.execute(`
                CREATE TABLE IF NOT EXISTS collector_action_log (
                    action_id INT NOT NULL AUTO_INCREMENT,
                    collector_id INT NOT NULL,
                    branch_id INT DEFAULT NULL,
                    business_manager_id INT DEFAULT NULL,
                    action_type ENUM('New Hire','Termination','Rehire','Transfer') NOT NULL,
                    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    remarks TEXT DEFAULT NULL,
                    PRIMARY KEY (action_id),
                    KEY fk_collector_action_log (collector_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
        }

        // Check if email already exists using stored procedure
        const [existingResult] = await connection.execute(
            'CALL sp_checkCollectorEmailExists(?)',
            [email]
        );

        if (existingResult[0] && existingResult[0].length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A collector with this email already exists'
            });
        }

        // Generate credentials
        const username = generateMobileUsername('collector');
        const password = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log(`📱 Creating collector: ${firstName} ${lastName} (${username})`);

        // Create collector using stored procedure
        const [insertResult] = await connection.execute(
            'CALL sp_createCollectorDirect(?, ?, ?, ?, ?, ?)',
            [username, firstName, lastName, email, hashedPassword, phoneNumber || null]
        );

        const collectorId = insertResult[0]?.[0]?.collector_id;

        // Create assignment using stored procedure
        await connection.execute(
            'CALL sp_createCollectorAssignmentDirect(?, ?, ?)',
            [collectorId, branchId, 'Newly hired collector']
        );

        // Log the action using stored procedure
        await connection.execute(
            'CALL sp_logCollectorAction(?, ?, ?, ?, ?)',
            [collectorId, branchId, branchManagerId, 'New Hire', `Collector ${firstName} ${lastName} was hired`]
        );

        console.log('✅ Collector created successfully');

        return res.status(201).json({
            success: true,
            message: 'Collector created successfully',
            data: {
                collectorId,
                credentials: {
                    username,
                    password
                },
                branchId
            }
        });
    } catch (error) {
        console.error('❌ Error creating collector:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create collector',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Get all inspectors by branch
 * GET /api/mobile-staff/inspectors
 * Query params: branchId (optional, overrides token branchId)
 */
export async function getInspectorsByBranch(req, res) {
    let connection;
    try {
        // Get branchId from query param first, then from token
        const branchId = req.query.branchId || req.user?.branchId;

        connection = await createConnection();
        
        // Set session timezone to Philippine time for correct timestamp conversion
        await connection.execute(`SET time_zone = '+08:00'`);

        let inspectors;

        if (branchId) {
            // Filter by branch if branchId is provided using stored procedure
            const [result] = await connection.execute(
                'CALL sp_getInspectorsByBranch(?)',
                [branchId]
            );
            inspectors = result[0] || [];
        } else {
            // Return all inspectors if no branchId (for admin view) using stored procedure
            const [result] = await connection.execute('CALL sp_getInspectorsAll()');
            inspectors = result[0] || [];
        }

        res.json({
            success: true,
            data: inspectors
        });
    } catch (error) {
        console.error('❌ Error fetching inspectors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inspectors',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Get all collectors by branch
 * GET /api/mobile-staff/collectors
 * Query params: branchId (optional, overrides token branchId)
 */
export async function getCollectorsByBranch(req, res) {
    let connection;
    try {
        // Get branchId from query param first, then from token
        const branchId = req.query.branchId || req.user?.branchId;

        connection = await createConnection();
        
        // Set session timezone to Philippine time for correct timestamp conversion
        await connection.execute(`SET time_zone = '+08:00'`);

        // Check if table exists first using stored procedure
        const [tableResult] = await connection.execute('CALL sp_checkCollectorTableExists()');

        if (!tableResult[0] || tableResult[0].length === 0) {
            // Collector table does not exist yet
            return res.json({
                success: true,
                data: [],
                message: 'No collectors table found'
            });
        }

        let collectors;

        if (branchId) {
            // Filter by branch if branchId is provided using stored procedure
            const [result] = await connection.execute(
                'CALL sp_getCollectorsByBranch(?)',
                [branchId]
            );
            collectors = result[0] || [];
        } else {
            // Return all collectors if no branchId (for admin view) using stored procedure
            const [result] = await connection.execute('CALL sp_getCollectorsAll()');
            collectors = result[0] || [];
        }

        res.json({
            success: true,
            data: collectors
        });
    } catch (error) {
        console.error('❌ Error fetching collectors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collectors',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Terminate/Deactivate an inspector
 * DELETE /api/mobile-staff/inspectors/:id
 */
export async function terminateInspector(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const branchManagerId = req.user?.userId || req.user?.businessManagerId;

        connection = await createConnection();

        // Terminate inspector using stored procedure
        await connection.execute(
            'CALL sp_terminateInspector(?, ?)',
            [id, reason || 'Terminated by manager']
        );

        // Get branch for logging using stored procedure
        const [assignmentResult] = await connection.execute(
            'CALL sp_getInspectorBranchAssignment(?)',
            [id]
        );
        const branchId = assignmentResult[0]?.[0]?.branch_id || null;

        // Log termination using stored procedure
        await connection.execute(
            'CALL sp_logInspectorAction(?, ?, ?, ?, ?)',
            [id, branchId, branchManagerId, 'Termination', reason || 'Terminated by manager']
        );

        res.json({
            success: true,
            message: 'Inspector terminated successfully'
        });
    } catch (error) {
        console.error('Error terminating inspector:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to terminate inspector',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Terminate/Deactivate a collector
 * DELETE /api/mobile-staff/collectors/:id
 */
export async function terminateCollector(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const branchManagerId = req.user?.userId || req.user?.businessManagerId;

        connection = await createConnection();

        // Terminate collector using stored procedure
        await connection.execute(
            'CALL sp_terminateCollector(?, ?)',
            [id, reason || 'Terminated by manager']
        );

        // Get branch for logging using stored procedure
        const [assignmentResult] = await connection.execute(
            'CALL sp_getCollectorBranchAssignment(?)',
            [id]
        );
        const branchId = assignmentResult[0]?.[0]?.branch_id || null;

        // Log termination using stored procedure
        await connection.execute(
            'CALL sp_logCollectorAction(?, ?, ?, ?, ?)',
            [id, branchId, branchManagerId, 'Termination', reason || 'Terminated by manager']
        );

        res.json({
            success: true,
            message: 'Collector terminated successfully'
        });
    } catch (error) {
        console.error('Error terminating collector:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to terminate collector',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Reset password for Inspector or Collector
 * POST /api/mobile-staff/reset-password
 * Body: { staffType: 'inspector' | 'collector', staffId: number, newPassword?: string }
 */
export async function resetStaffPassword(req, res) {
    let connection;
    try {
        const { staffType, staffId, newPassword } = req.body;
        
        if (!staffType || !staffId) {
            return res.status(400).json({
                success: false,
                message: 'staffType and staffId are required'
            });
        }
        
        if (!['inspector', 'collector'].includes(staffType)) {
            return res.status(400).json({
                success: false,
                message: 'staffType must be either "inspector" or "collector"'
            });
        }
        
        connection = await createConnection();
        
        // Generate new password or use provided one
        const password = newPassword || generateSecurePassword();
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update password using appropriate stored procedure based on staff type
        let result;
        if (staffType === 'inspector') {
            const [spResult] = await connection.execute(
                'CALL sp_resetInspectorPassword(?, ?)',
                [staffId, hashedPassword]
            );
            result = spResult[0]?.[0];
        } else {
            const [spResult] = await connection.execute(
                'CALL sp_resetCollectorPassword(?, ?)',
                [staffId, hashedPassword]
            );
            result = spResult[0]?.[0];
        }
        
        if (!result || result.affected_rows === 0) {
            return res.status(404).json({
                success: false,
                message: `${staffType} with ID ${staffId} not found`
            });
        }
        
        console.log(`✅ Password reset for ${staffType} ID: ${staffId}`);
        
        return res.json({
            success: true,
            message: `Password reset successfully for ${staffType}`,
            data: {
                staffType,
                staffId,
                newPassword: password
            }
        });
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

