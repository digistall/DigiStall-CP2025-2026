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

        // Check if email already exists
        const [existingEmail] = await connection.execute(
            'SELECT inspector_id FROM inspector WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
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

        // Try to use stored procedure first, fallback to direct insert
        try {
            const [[result]] = await connection.execute(
                'CALL createInspectorWithCredentials(?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [username, hashedPassword, firstName, lastName, email, phoneNumber || null, branchId, null, branchManagerId]
            );

            console.log('✅ Inspector created via stored procedure');

            return res.status(201).json({
                success: true,
                message: 'Inspector created successfully',
                data: {
                    inspectorId: result.inspector_id,
                    credentials: {
                        username,
                        password
                    },
                    branchId
                }
            });
        } catch (spError) {
            console.log('⚠️ Stored procedure not available, using direct insert');
            
            // Direct insert fallback
            const [insertResult] = await connection.execute(
                `INSERT INTO inspector (first_name, last_name, middle_name, email, password, contact_no, date_hired, status)
                 VALUES (?, ?, '', ?, ?, ?, CURDATE(), 'active')`,
                [firstName, lastName, email, hashedPassword, phoneNumber || null]
            );

            const inspectorId = insertResult.insertId;

            // Create assignment
            await connection.execute(
                `INSERT INTO inspector_assignment (inspector_id, branch_id, start_date, status, remarks)
                 VALUES (?, ?, CURDATE(), 'Active', 'Newly hired inspector')`,
                [inspectorId, branchId]
            );

            // Log the action
            await connection.execute(
                `INSERT INTO inspector_action_log (inspector_id, branch_id, business_manager_id, action_type, action_date, remarks)
                 VALUES (?, ?, ?, 'New Hire', NOW(), ?)`,
                [inspectorId, branchId, branchManagerId, `Inspector ${firstName} ${lastName} was hired`]
            );

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
        }
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

        // Check if collector table exists, create if not
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
                PRIMARY KEY (collector_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        // Check if collector_assignment table exists
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

        // Check if collector_action_log table exists
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

        // Check if email already exists
        const [existingEmail] = await connection.execute(
            'SELECT collector_id FROM collector WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
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

        // Insert collector
        const [insertResult] = await connection.execute(
            `INSERT INTO collector (username, password_hash, first_name, last_name, email, contact_no, date_hired, status)
             VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'active')`,
            [username, hashedPassword, firstName, lastName, email, phoneNumber || null]
        );

        const collectorId = insertResult.insertId;

        // Create assignment
        await connection.execute(
            `INSERT INTO collector_assignment (collector_id, branch_id, start_date, status, remarks)
             VALUES (?, ?, CURDATE(), 'Active', 'Newly hired collector')`,
            [collectorId, branchId]
        );

        // Log the action
        await connection.execute(
            `INSERT INTO collector_action_log (collector_id, branch_id, business_manager_id, action_type, action_date, remarks)
             VALUES (?, ?, ?, 'New Hire', NOW(), ?)`,
            [collectorId, branchId, branchManagerId, `Collector ${firstName} ${lastName} was hired`]
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
        
        console.log('📱 Fetching inspectors for branch:', branchId);

        connection = await createConnection();

        let query;
        let params;

        if (branchId) {
            // Filter by branch if branchId is provided
            query = `
                SELECT 
                    i.inspector_id,
                    i.first_name,
                    i.last_name,
                    i.email,
                    i.contact_no,
                    i.date_hired,
                    i.status,
                    i.last_login,
                    ia.branch_id,
                    b.branch_name
                FROM inspector i
                LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
                LEFT JOIN branch b ON ia.branch_id = b.branch_id
                WHERE ia.branch_id = ?
                ORDER BY i.date_hired DESC
            `;
            params = [branchId];
        } else {
            // Return all inspectors if no branchId (for admin view)
            query = `
                SELECT 
                    i.inspector_id,
                    i.first_name,
                    i.last_name,
                    i.email,
                    i.contact_no,
                    i.date_hired,
                    i.status,
                    i.last_login,
                    ia.branch_id,
                    b.branch_name
                FROM inspector i
                LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
                LEFT JOIN branch b ON ia.branch_id = b.branch_id
                ORDER BY i.date_hired DESC
            `;
            params = [];
        }

        const [inspectors] = await connection.execute(query, params);

        console.log(`✅ Found ${inspectors.length} inspectors${branchId ? ` for branch ${branchId}` : ''}`);

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
        
        console.log('📱 Fetching collectors for branch:', branchId);

        connection = await createConnection();

        // Check if table exists first
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector'"
        );

        if (tables.length === 0) {
            console.log('⚠️ Collector table does not exist yet');
            return res.json({
                success: true,
                data: [],
                message: 'No collectors table found'
            });
        }

        let query;
        let params;

        if (branchId) {
            // Filter by branch if branchId is provided
            query = `
                SELECT 
                    c.collector_id,
                    c.first_name,
                    c.last_name,
                    c.email,
                    c.contact_no,
                    c.date_hired,
                    c.status,
                    c.date_created,
                    c.last_login,
                    ca.branch_id,
                    b.branch_name
                FROM collector c
                LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
                LEFT JOIN branch b ON ca.branch_id = b.branch_id
                WHERE ca.branch_id = ?
                ORDER BY c.date_created DESC
            `;
            params = [branchId];
        } else {
            // Return all collectors if no branchId (for admin view)
            query = `
                SELECT 
                    c.collector_id,
                    c.first_name,
                    c.last_name,
                    c.email,
                    c.contact_no,
                    c.date_hired,
                    c.status,
                    c.date_created,
                    c.last_login,
                    ca.branch_id,
                    b.branch_name
                FROM collector c
                LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
                LEFT JOIN branch b ON ca.branch_id = b.branch_id
                ORDER BY c.date_created DESC
            `;
            params = [];
        }

        const [collectors] = await connection.execute(query, params);

        console.log(`✅ Found ${collectors.length} collectors${branchId ? ` for branch ${branchId}` : ''}`);

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

        // Update inspector status
        await connection.execute(
            `UPDATE inspector SET status = 'inactive', termination_date = CURDATE(), termination_reason = ? WHERE inspector_id = ?`,
            [reason || 'Terminated by manager', id]
        );

        // Update assignment
        await connection.execute(
            `UPDATE inspector_assignment SET status = 'Inactive', end_date = CURDATE() WHERE inspector_id = ? AND status = 'Active'`,
            [id]
        );

        // Get branch for logging
        const [assignment] = await connection.execute(
            'SELECT branch_id FROM inspector_assignment WHERE inspector_id = ? LIMIT 1',
            [id]
        );
        const branchId = assignment.length > 0 ? assignment[0].branch_id : null;

        // Log termination
        await connection.execute(
            `INSERT INTO inspector_action_log (inspector_id, branch_id, business_manager_id, action_type, remarks)
             VALUES (?, ?, ?, 'Termination', ?)`,
            [id, branchId, branchManagerId, reason || 'Terminated by manager']
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

        // Update collector status
        await connection.execute(
            `UPDATE collector SET status = 'inactive', termination_date = CURDATE(), termination_reason = ? WHERE collector_id = ?`,
            [reason || 'Terminated by manager', id]
        );

        // Update assignment
        await connection.execute(
            `UPDATE collector_assignment SET status = 'Inactive', end_date = CURDATE() WHERE collector_id = ? AND status = 'Active'`,
            [id]
        );

        // Get branch for logging
        const [assignment] = await connection.execute(
            'SELECT branch_id FROM collector_assignment WHERE collector_id = ? LIMIT 1',
            [id]
        );
        const branchId = assignment.length > 0 ? assignment[0].branch_id : null;

        // Log termination
        await connection.execute(
            `INSERT INTO collector_action_log (collector_id, branch_id, business_manager_id, action_type, remarks)
             VALUES (?, ?, ?, 'Termination', ?)`,
            [id, branchId, branchManagerId, reason || 'Terminated by manager']
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
        
        // Update password based on staff type
        const table = staffType === 'inspector' ? 'inspector' : 'collector';
        const idColumn = staffType === 'inspector' ? 'inspector_id' : 'collector_id';
        
        const [result] = await connection.execute(
            `UPDATE ${table} SET password_hash = ? WHERE ${idColumn} = ?`,
            [hashedPassword, staffId]
        );
        
        if (result.affectedRows === 0) {
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

