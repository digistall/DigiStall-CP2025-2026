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
        
        await connection.execute(`
            INSERT INTO staff_activity_log 
            (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
             module, ip_address, user_agent, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
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
        
        // Try to find inspector first
        let staffData = null;
        let staffType = null;
        
        // Check inspector table (inspector table uses 'password' column, not 'password_hash')
        const [inspectors] = await connection.execute(`
            SELECT 
                i.inspector_id as staff_id,
                i.username,
                i.first_name,
                i.last_name,
                i.middle_name,
                i.email,
                i.contact_no,
                i.status,
                i.password as password_hash,
                ia.branch_id,
                b.branch_name
            FROM inspector i
            LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
            LEFT JOIN branch b ON ia.branch_id = b.branch_id
            WHERE (i.username = ? OR i.email = ?)
              AND i.status = 'active'
            LIMIT 1
        `, [username, username]);
        
        if (inspectors.length > 0) {
            staffData = inspectors[0];
            staffType = 'inspector';
            console.log('✅ Found inspector:', staffData.first_name, staffData.last_name);
        } else {
            // Check collector table
            const [collectors] = await connection.execute(`
                SELECT 
                    c.collector_id as staff_id,
                    c.username,
                    c.first_name,
                    c.last_name,
                    c.middle_name,
                    c.email,
                    c.contact_no,
                    c.status,
                    c.password_hash,
                    ca.branch_id,
                    b.branch_name
                FROM collector c
                LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
                LEFT JOIN branch b ON ca.branch_id = b.branch_id
                WHERE (c.username = ? OR c.email = ?)
                  AND c.status = 'active'
                LIMIT 1
            `, [username, username]);
            
            if (collectors.length > 0) {
                staffData = collectors[0];
                staffType = 'collector';
                console.log('✅ Found collector:', staffData.first_name, staffData.last_name);
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
        
        // Generate JWT token
        const token = jwt.sign(
            {
                staffId: staffData.staff_id,
                staffType: staffType,
                userId: staffData.staff_id,
                userType: staffType,
                email: staffData.email,
                branchId: staffData.branch_id,
                fullName: `${staffData.first_name} ${staffData.last_name}`
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Update last login with Philippine time
        const philippineTime = getPhilippineTime();
        if (staffType === 'inspector') {
            await connection.execute(
                "UPDATE inspector SET last_login = ? WHERE inspector_id = ?",
                [philippineTime, staffData.staff_id]
            );
        } else {
            await connection.execute(
                "UPDATE collector SET last_login = ? WHERE collector_id = ?",
                [philippineTime, staffData.staff_id]
            );
        }
        
        // Log the login activity
        await logStaffActivity({
            staffType: staffType,
            staffId: staffData.staff_id,
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
                id: staffData.staff_id,
                staffId: staffData.staff_id,
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

export default {
    mobileStaffLogin
};
