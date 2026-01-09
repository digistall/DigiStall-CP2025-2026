import { createConnection } from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { decryptStaffData } from '../services/mysqlDecryptionService.js';

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
        
        // Check inspector table first using stored procedure
        try {
            const [inspectorResult] = await connection.execute(
                'CALL sp_getInspectorByUsername(?)',
                [username]
            );
            const inspectors = inspectorResult[0] || [];
            
            console.log('🔍 RAW inspector result from stored procedure:', JSON.stringify(inspectors[0], null, 2));
            
            if (inspectors && inspectors.length > 0) {
                staffData = inspectors[0];
                console.log('🔍 BEFORE decryptStaffData - first_name:', staffData.first_name, 'last_name:', staffData.last_name);
                // Decrypt staff data if encrypted
                staffData = await decryptStaffData(staffData);
                console.log('🔍 AFTER decryptStaffData - first_name:', staffData.first_name, 'last_name:', staffData.last_name);
                staffType = 'inspector';
                console.log('✅ Found inspector:', staffData.first_name, staffData.last_name);
            }
        } catch (err) {
            console.warn('⚠️ Error checking inspector:', err.message);
        }
        
        // If not inspector, check collector table using stored procedure
        if (!staffData) {
            try {
                const [collectorResult] = await connection.execute(
                    'CALL sp_getCollectorByUsername(?)',
                    [username]
                );
                const collectors = collectorResult[0] || [];
                
                if (collectors && collectors.length > 0) {
                    staffData = collectors[0];
                    // Decrypt staff data if encrypted
                    staffData = await decryptStaffData(staffData);
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
        
        // Update last_login using stored procedures
        if (staffType === 'inspector') {
            await connection.execute('CALL sp_updateInspectorLastLogin(?)', [staffId]);
            console.log(`✅ Updated last_login for inspector ${staffId}`);
        } else {
            await connection.execute('CALL sp_updateCollectorLastLogin(?)', [staffId]);
            console.log(`✅ Updated last_login for collector ${staffId}`);
        }
        
        // Create/update staff session for online status tracking using stored procedures
        console.log(`📊 Creating/updating staff session for ${staffType} ${staffId}...`);
        try {
            // Set session timezone to Philippine time to ensure correct timestamp storage
            await connection.execute(`SET time_zone = '+08:00'`);
            
            // First, deactivate any old sessions for this staff
            await connection.execute('CALL sp_deactivateStaffSessions(?, ?)', [staffId, staffType]);
            
            // Insert new active session using stored procedure
            await connection.execute(
                'CALL sp_createStaffSession(?, ?, ?, ?, ?)',
                [staffId, staffType, token, req.ip || req.connection?.remoteAddress || 'unknown', req.get('User-Agent') || 'Mobile App']
            );
            console.log(`✅ Staff session created for ${staffType}: ${staffData.first_name} at ${philippineTime}`);
        } catch (sessionError) {
            console.error('❌ Failed to create staff session:', sessionError.message);
            // Try with minimal columns in case table schema is different
            try {
                await connection.execute(`SET time_zone = '+08:00'`);
                await connection.execute('CALL sp_createStaffSessionMinimal(?, ?)', [staffId, staffType]);
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
            
            // Update last_logout using stored procedures
            if (staffType === 'inspector') {
                await connection.execute('CALL sp_updateInspectorLastLogout(?)', [staffId]);
                console.log(`✅ Updated last_logout for inspector ${staffId}`);
            } else if (staffType === 'collector') {
                await connection.execute('CALL sp_updateCollectorLastLogout(?)', [staffId]);
                console.log(`✅ Updated last_logout for collector ${staffId}`);
            }
            
            // End staff session using stored procedure
            await connection.execute('CALL sp_endStaffSession(?, ?)', [staffId, staffType]);
            console.log(`✅ Staff session ended for ${staffType} ${staffId}`);
            
            // Get staff name for activity log using stored procedure
            let staffName = 'Unknown';
            if (staffType === 'inspector') {
                const [nameResult] = await connection.execute('CALL sp_getInspectorName(?)', [staffId]);
                const rows = nameResult[0] || [];
                if (rows.length > 0) {
                    staffName = `${rows[0].first_name} ${rows[0].last_name}`;
                }
            } else if (staffType === 'collector') {
                const [nameResult] = await connection.execute('CALL sp_getCollectorName(?)', [staffId]);
                const rows = nameResult[0] || [];
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
        
        // Update last_login using stored procedures
        if (staffType === 'inspector') {
            await connection.execute('CALL sp_updateInspectorLastLogin(?)', [staffId]);
        } else if (staffType === 'collector') {
            await connection.execute('CALL sp_updateCollectorLastLogin(?)', [staffId]);
        }
        
        // Update staff session last_activity using stored procedure
        await connection.execute('CALL sp_updateStaffSessionActivity(?, ?)', [staffId, staffType]);
        
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
