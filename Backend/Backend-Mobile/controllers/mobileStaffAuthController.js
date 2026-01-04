import { createConnection } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Mobile Staff Login Controller
 * Handles authentication for Inspectors and Collectors on mobile app
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

// ===== LOG STAFF ACTIVITY =====
async function logStaffActivity(activityData) {
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
            status = 'success'
        } = activityData;

        const philippineTime = getPhilippineTime();
        
        // Use stored procedure for activity logging
        await connection.execute(`CALL sp_logStaffActivity(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            staffType,
            staffId,
            staffName,
            branchId || null,
            actionType,
            actionDescription || null,
            module || 'mobile_app',
            ipAddress || null,
            userAgent || null,
            status,
            philippineTime
        ]);

        console.log(`📝 Activity logged: ${staffType} - ${staffName} - ${actionType} at ${philippineTime}`);
        return true;
    } catch (error) {
        console.error('❌ Error logging activity:', error);
        return false;
    } finally {
        if (connection) await connection.end();
    }
}

// ===== MOBILE STAFF LOGIN =====
export const mobileStaffLogin = async (req, res) => {
    let connection;
    
    try {
        connection = await createConnection();
        const { username, password } = req.body;
        
        console.log('📱 Mobile staff login attempt for:', username);
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        // ===== DIRECT SQL ONLY - NO STORED PROCEDURES =====
        let staffData = null;
        let staffType = null;
        
        // Check inspector table first (with COLLATE to fix collation mismatch)
        // NOTE: Inspector table only has 'password' column (not password_hash)
        try {
            const [inspectors] = await connection.execute(`
                SELECT 
                    i.inspector_id,
                    i.username,
                    i.first_name,
                    i.last_name,
                    i.email,
                    i.password as password_hash,
                    i.contact_no,
                    i.status,
                    ia.branch_id,
                    b.branch_name
                FROM inspector i
                LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
                LEFT JOIN branch b ON ia.branch_id = b.branch_id
                WHERE i.username COLLATE utf8mb4_general_ci = ? COLLATE utf8mb4_general_ci 
                  AND i.status COLLATE utf8mb4_general_ci = 'active'
                LIMIT 1
            `, [username]);
            
            if (inspectors && inspectors.length > 0) {
                staffData = inspectors[0];
                staffType = 'inspector';
                console.log('✅ Found inspector:', staffData.first_name, staffData.last_name);
            }
        } catch (err) {
            console.warn('⚠️ Error checking inspector:', err.message);
        }
        
        // If not inspector, check collector table (with COLLATE to fix collation mismatch)
        if (!staffData) {
            try {
                const [collectors] = await connection.execute(`
                    SELECT 
                        c.collector_id,
                        c.username,
                        c.first_name,
                        c.last_name,
                        c.email,
                        c.password_hash,
                        c.contact_no,
                        c.status,
                        ca.branch_id,
                        b.branch_name
                    FROM collector c
                    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
                    LEFT JOIN branch b ON ca.branch_id = b.branch_id
                    WHERE c.username COLLATE utf8mb4_general_ci = ? COLLATE utf8mb4_general_ci 
                      AND c.status COLLATE utf8mb4_general_ci = 'active'
                    LIMIT 1
                `, [username]);
                
                if (collectors && collectors.length > 0) {
                    staffData = collectors[0];
                    staffType = 'collector';
                    console.log('✅ Found collector:', staffData.first_name, staffData.last_name);
                }
            } catch (err) {
                console.warn('⚠️ Error checking collector:', err.message);
            }
        }
        
        if (!staffData) {
            console.log('❌ No staff found with username:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Verify password
        let isValidPassword = false;
        const storedPassword = staffData.password_hash;
        
        console.log('🔐 Password verification debug:');
        console.log('   - Stored password hash (first 20 chars):', storedPassword ? storedPassword.substring(0, 20) + '...' : 'NULL');
        console.log('   - Password length entered:', password.length);
        console.log('   - Is bcrypt hash:', storedPassword?.startsWith('$2b$') || storedPassword?.startsWith('$2a$'));
        
        try {
            // Try bcrypt comparison
            if (storedPassword && (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$'))) {
                isValidPassword = await bcrypt.compare(password, storedPassword);
                console.log('   - Bcrypt comparison result:', isValidPassword);
            } else if (storedPassword) {
                // Fallback for SHA256 hashed passwords (legacy inspector)
                const crypto = await import('crypto');
                const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
                isValidPassword = storedPassword === sha256Hash;
                
                // Also try plain text comparison (temporary fix)
                if (!isValidPassword) {
                    isValidPassword = password === storedPassword;
                }
            }
        } catch (error) {
            console.error('❌ Password verification error:', error);
            isValidPassword = false;
        }
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        console.log('✅ Password verified for:', username);
        
        // Get the correct staff ID field based on type
        // The stored procedures return the ID as 'staff_id' (aliased)
        // Fallback to inspector_id/collector_id for backwards compatibility
        const staffId = staffData.staff_id || (staffType === 'inspector' ? staffData.inspector_id : staffData.collector_id);
        
        // Generate JWT token
        const token = jwt.sign(
            {
                staffId: staffId,
                staffType: staffType,
                userId: staffId,
                userType: staffType,
                email: staffData.email,
                branchId: staffData.branch_id,
                fullName: `${staffData.first_name} ${staffData.last_name}`
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Update last login with Philippine time - DIRECT SQL (more reliable than stored procedures)
        const philippineTime = getPhilippineTime();
        console.log(`📅 Updating last_login for ${staffType} ${staffId} at ${philippineTime}`);
        
        // Set session timezone to Philippine time
        await connection.execute(`SET time_zone = '+08:00'`);
        
        // ===== DIRECT SQL ONLY - NO STORED PROCEDURES =====
        // Update last_login in inspector/collector table using NOW() with correct timezone
        if (staffType === 'inspector') {
            await connection.execute(
                `UPDATE inspector SET last_login = NOW() WHERE inspector_id = ?`,
                [staffId]
            );
            console.log(`✅ Updated last_login for inspector ${staffId}`);
        } else {
            await connection.execute(
                `UPDATE collector SET last_login = NOW() WHERE collector_id = ?`,
                [staffId]
            );
            console.log(`✅ Updated last_login for collector ${staffId}`);
        }
        
        // Create/update staff session for online status tracking (DIRECT SQL)
        console.log(`📊 Creating/updating staff session for ${staffType} ${staffId}...`);
        try {
            // Set session timezone to Philippine time to ensure correct timestamp storage
            await connection.execute(`SET time_zone = '+08:00'`);
            
            // First, deactivate any old sessions for this staff
            await connection.execute(
                `UPDATE staff_session SET is_active = 0 WHERE staff_id = ? AND staff_type = ?`,
                [staffId, staffType]
            );
            
            // Insert new active session with Philippine time (NOW() will use the session timezone)
            await connection.execute(
                `INSERT INTO staff_session (staff_id, staff_type, session_token, ip_address, user_agent, login_time, last_activity, is_active) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)`,
                [staffId, staffType, token, req.ip || req.connection?.remoteAddress || 'unknown', req.get('User-Agent') || 'Mobile App']
            );
            console.log(`✅ Staff session created for ${staffType}: ${staffData.first_name} at ${philippineTime}`);
        } catch (sessionError) {
            console.error('❌ Failed to create staff session:', sessionError.message);
            // Try with minimal columns in case table schema is different
            try {
                await connection.execute(`SET time_zone = '+08:00'`);
                await connection.execute(
                    `INSERT INTO staff_session (staff_id, staff_type, is_active, login_time, last_activity) 
                     VALUES (?, ?, 1, NOW(), NOW())`,
                    [staffId, staffType]
                );
                console.log(`✅ Staff session created (minimal) for ${staffType}: ${staffData.first_name}`);
            } catch (fallbackError) {
                console.error('❌ Fallback session creation also failed:', fallbackError.message);
            }
        }
        
        // Log the login activity
        await logStaffActivity({
            staffType: staffType,
            staffId: staffId,
            staffName: `${staffData.first_name} ${staffData.last_name}`,
            branchId: staffData.branch_id,
            actionType: 'LOGIN',
            actionDescription: `${staffType} logged in via mobile app`,
            module: 'mobile_app',
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'success'
        });
        
        console.log(`✅ ${staffType} login successful:`, staffData.first_name);
        
        res.json({
            success: true,
            message: `${staffType.charAt(0).toUpperCase() + staffType.slice(1)} login successful`,
            token,
            user: {
                id: staffId,
                staffId: staffId,
                staffType: staffType,
                role: staffType,
                userType: staffType,
                firstName: staffData.first_name,
                lastName: staffData.last_name,
                fullName: `${staffData.first_name} ${staffData.last_name}`,
                email: staffData.email,
                phoneNumber: staffData.contact_no,
                branchId: staffData.branch_id,
                branchName: staffData.branch_name
            }
        });
        
    } catch (error) {
        console.error('❌ Mobile staff login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
};

// ===== MOBILE STAFF LOGOUT =====
export const mobileStaffLogout = async (req, res) => {
    let connection;
    
    try {
        connection = await createConnection();
        
        // Get staff info from JWT token (set by auth middleware) or from body
        const staffId = req.user?.staffId || req.user?.userId || req.body?.staffId;
        const staffType = req.user?.staffType || req.user?.userType || req.body?.staffType;
        
        const philippineTime = getPhilippineTime();
        
        console.log('='.repeat(60));
        console.log('📱 MOBILE STAFF LOGOUT REQUEST');
        console.log('📱 Timestamp:', new Date().toISOString());
        console.log('📱 Extracted staffId:', staffId, 'staffType:', staffType);
        console.log('📱 Philippine time:', philippineTime);
        console.log('='.repeat(60));
        
        if (staffId && staffType) {
            // Set session timezone to Philippine time
            await connection.execute(`SET time_zone = '+08:00'`);
            
            // ===== DIRECT SQL ONLY - NO STORED PROCEDURES =====
            // Update last_logout using NOW() with correct timezone
            if (staffType === 'inspector') {
                await connection.execute(`UPDATE inspector SET last_logout = NOW() WHERE inspector_id = ?`, [staffId]);
                console.log(`✅ Updated last_logout for inspector ${staffId}`);
            } else if (staffType === 'collector') {
                await connection.execute(`UPDATE collector SET last_logout = NOW() WHERE collector_id = ?`, [staffId]);
                console.log(`✅ Updated last_logout for collector ${staffId}`);
            }
            
            // End staff session (set is_active = 0) using NOW() for logout_time and last_activity
            await connection.execute(
                `UPDATE staff_session SET is_active = 0, logout_time = NOW(), last_activity = NOW() WHERE staff_id = ? AND staff_type = ? AND is_active = 1`,
                [staffId, staffType]
            );
            console.log(`✅ Staff session ended for ${staffType} ${staffId}`);
            
            // Get staff name for activity log
            let staffName = 'Unknown';
            if (staffType === 'inspector') {
                const [rows] = await connection.execute(`SELECT first_name, last_name FROM inspector WHERE inspector_id = ?`, [staffId]);
                if (rows.length > 0) {
                    staffName = `${rows[0].first_name} ${rows[0].last_name}`;
                }
            } else if (staffType === 'collector') {
                const [rows] = await connection.execute(`SELECT first_name, last_name FROM collector WHERE collector_id = ?`, [staffId]);
                if (rows.length > 0) {
                    staffName = `${rows[0].first_name} ${rows[0].last_name}`;
                }
            }
            
            // Log the logout activity
            await logStaffActivity({
                staffType: staffType,
                staffId: staffId,
                staffName: staffName,
                branchId: req.user?.branchId || null,
                actionType: 'LOGOUT',
                actionDescription: `${staffType} logged out from mobile app`,
                module: 'mobile_app',
                ipAddress: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'success'
            });
        }
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
        
    } catch (error) {
        console.error('❌ Mobile staff logout error:', error);
        // Still return success to client (logout should always "succeed" from user perspective)
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } finally {
        if (connection) await connection.end();
    }
};

export default {
    mobileStaffLogin,
    mobileStaffLogout
};
