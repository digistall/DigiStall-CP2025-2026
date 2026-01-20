import { createConnection } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { decryptStaffData } from '../services/mysqlDecryptionService.js';

// Get encryption key using same derivation as Web backend
const getEncryptionKey = () => {
    const envKey = process.env.DATA_ENCRYPTION_KEY || 'DigiStall2025SecureKeyForEncryption123';
    // Use scryptSync with same salt as Web backend
    return crypto.scryptSync(envKey, 'digistall-salt-v2', 32);
};

// Cache the key
let cachedKey = null;
const getKey = () => {
    if (!cachedKey) {
        cachedKey = getEncryptionKey();
    }
    return cachedKey;
};

// Decrypt AES-256-GCM encrypted data (format: iv:authTag:encrypted)
const decryptAES256GCM = (encryptedData) => {
    if (!encryptedData || typeof encryptedData !== 'string' || !encryptedData.includes(':')) {
        return encryptedData;
    }
    
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        return encryptedData;
    }
    
    try {
        const [ivBase64, authTagBase64, encrypted] = parts;
        const key = getKey();  // Use properly derived key
        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('❌ AES-256-GCM decryption error:', error.message);
        return encryptedData;
    }
};

// Decrypt all encrypted fields in staff data
const decryptStaffFields = (staffData) => {
    if (!staffData) return staffData;
    
    const result = { ...staffData };
    
    // Decrypt fields that might be encrypted
    const fieldsToDecrypt = ['first_name', 'last_name', 'contact_no', 'middle_name'];
    
    for (const field of fieldsToDecrypt) {
        if (result[field] && typeof result[field] === 'string' && result[field].includes(':')) {
            const decrypted = decryptAES256GCM(result[field]);
            if (decrypted !== result[field]) {
                console.log(`🔓 Decrypted ${field}: ${decrypted}`);
                result[field] = decrypted;
            }
        }
    }
    
    return result;
};

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
                console.log('🔍 BEFORE decryption - first_name:', staffData.first_name, 'last_name:', staffData.last_name);
                // Decrypt staff data using our custom function
                staffData = decryptStaffFields(staffData);
                console.log('🔍 AFTER decryption - first_name:', staffData.first_name, 'last_name:', staffData.last_name);
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
                    // Decrypt staff data using our custom function
                    staffData = decryptStaffFields(staffData);
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
        console.log('   - Is AES-GCM encrypted:', storedPassword?.includes(':') && storedPassword?.split(':').length === 3);
        
        try {
            // Try bcrypt comparison
            if (storedPassword && (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$'))) {
                isValidPassword = await bcrypt.compare(password, storedPassword);
                console.log('   - Bcrypt comparison result:', isValidPassword);
            } else if (storedPassword && storedPassword.includes(':') && storedPassword.split(':').length === 3) {
                // Decrypt AES-256-GCM encrypted password and compare directly
                const decryptedPassword = decryptAES256GCM(storedPassword);
                console.log('   - Decrypted password (first 3 chars):', decryptedPassword ? decryptedPassword.substring(0, 3) + '***' : 'NULL');
                isValidPassword = password === decryptedPassword;
                console.log('   - AES-GCM decryption comparison result:', isValidPassword);
            } else if (storedPassword) {
                // Fallback for SHA256 hashed passwords (legacy inspector)
                const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
                isValidPassword = storedPassword === sha256Hash;
                
                // Also try plain text comparison (temporary fix)
                if (!isValidPassword) {
                    isValidPassword = password === storedPassword;
                }
                console.log('   - Legacy comparison result:', isValidPassword);
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
                `UPDATE staff_session SET is_active = 0 WHERE user_id = ? AND user_type = ?`,
                [staffId, staffType]
            );
            
            // Insert new active session with Philippine time (NOW() will use the session timezone)
            await connection.execute(
                `INSERT INTO staff_session (user_id, user_type, session_token, ip_address, user_agent, login_time, last_activity, is_active) 
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
                    `INSERT INTO staff_session (user_id, user_type, is_active, login_time, last_activity) 
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
                `UPDATE staff_session 
                 SET is_active = 0, logout_time = NOW(), last_activity = NOW() 
                 WHERE user_id = ? AND user_type = ? AND is_active = 1`,
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

// ===== MOBILE STAFF HEARTBEAT =====
// Updates last_login to keep staff marked as "online"
export const mobileStaffHeartbeat = async (req, res) => {
    let connection;
    
    try {
        const staffId = req.user?.staffId || req.user?.userId || req.body?.staffId;
        const staffType = req.user?.staffType || req.user?.userType || req.body?.staffType;
        
        if (!staffId || !staffType) {
            return res.status(400).json({
                success: false,
                message: 'Missing staffId or staffType'
            });
        }
        
        connection = await createConnection();
        const philippineTime = getPhilippineTime();
        
        // Set session timezone to Philippine time
        await connection.execute(`SET time_zone = '+08:00'`);
        
        // CRITICAL: Check if staff has an active session before updating last_login
        // This prevents heartbeats that arrive after logout from updating last_login
        const [sessionCheck] = await connection.execute(
            `SELECT session_id FROM staff_session 
             WHERE user_id = ? AND user_type = ? AND is_active = 1 
             LIMIT 1`,
            [staffId, staffType]
        );
        
        if (sessionCheck.length === 0) {
            // No active session - staff has logged out, don't update last_login
            console.log(`⚠️ Heartbeat rejected - no active session for ${staffType} ${staffId}`);
            return res.json({
                success: false,
                message: 'No active session found',
                timestamp: philippineTime
            });
        }
        
        // Staff has active session, safe to update last_login using direct SQL
        if (staffType === 'inspector') {
            await connection.execute(`UPDATE inspector SET last_login = NOW() WHERE inspector_id = ?`, [staffId]);
        } else if (staffType === 'collector') {
            await connection.execute(`UPDATE collector SET last_login = NOW() WHERE collector_id = ?`, [staffId]);
        }
        
        // Update staff session last_activity
        await connection.execute(
            `UPDATE staff_session SET last_activity = NOW() WHERE user_id = ? AND user_type = ? AND is_active = 1`,
            [staffId, staffType]
        );
        
        console.log(`💓 Mobile heartbeat received from ${staffType} ${staffId}`);
        
        res.json({
            success: true,
            message: 'Heartbeat recorded',
            timestamp: philippineTime
        });
        
    } catch (error) {
        console.error('❌ Mobile staff heartbeat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording heartbeat',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
};

// ===== MOBILE STAFF AUTO-LOGOUT =====
// Handles automatic logout due to inactivity
export const mobileStaffAutoLogout = async (req, res) => {
    let connection;
    
    try {
        const staffId = req.user?.staffId || req.user?.userId || req.body?.staffId;
        const staffType = req.user?.staffType || req.user?.userType || req.body?.staffType;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        console.log('='.repeat(60));
        console.log('⏰ MOBILE STAFF AUTO-LOGOUT REQUEST');
        console.log('⏰ Timestamp:', new Date().toISOString());
        console.log('⏰ staffId:', staffId, 'staffType:', staffType);
        console.log('='.repeat(60));
        
        if (!staffId || !staffType) {
            return res.status(400).json({
                success: false,
                message: 'Missing staffId or staffType'
            });
        }
        
        connection = await createConnection();
        const philippineTime = getPhilippineTime();
        
        // Set session timezone to Philippine time
        await connection.execute(`SET time_zone = '+08:00'`);
        
        // Use stored procedures for auto-logout
        if (staffType === 'inspector') {
            await connection.execute('CALL sp_autoLogoutInspector(?, ?, ?, ?)', 
                [staffId, philippineTime, ipAddress, userAgent]);
            console.log(`✅ Auto-logout recorded for inspector ${staffId}`);
        } else if (staffType === 'collector') {
            await connection.execute('CALL sp_autoLogoutCollector(?, ?, ?, ?)', 
                [staffId, philippineTime, ipAddress, userAgent]);
            console.log(`✅ Auto-logout recorded for collector ${staffId}`);
        }
        
        res.json({
            success: true,
            message: 'Auto-logout recorded successfully',
            timestamp: philippineTime
        });
        
    } catch (error) {
        console.error('❌ Mobile staff auto-logout error:', error);
        // Still return success (auto-logout should always "succeed" from user perspective)
        res.json({
            success: true,
            message: 'Auto-logout processed'
        });
    } finally {
        if (connection) await connection.end();
    }
};

export default {
    mobileStaffLogin,
    mobileStaffLogout,
    mobileStaffHeartbeat,
    mobileStaffAutoLogout
};
