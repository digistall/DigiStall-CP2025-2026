// ===== UNIFIED AUTHENTICATION CONTROLLER =====
// Single clean authentication system for all user types

import { createConnection } from '../../config/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { decryptData } from '../../services/encryptionService.js'

// Helper function to decrypt data safely (handles both encrypted and plain text)
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

// Helper function to get Philippine time in MySQL format
const getPhilippineTime = () => {
  const now = new Date();
  // Convert to Philippine timezone (UTC+8)
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  // Format as MySQL datetime: YYYY-MM-DD HH:MM:SS
  const year = phTime.getFullYear();
  const month = String(phTime.getMonth() + 1).padStart(2, '0');
  const day = String(phTime.getDate()).padStart(2, '0');
  const hours = String(phTime.getHours()).padStart(2, '0');
  const minutes = String(phTime.getMinutes()).padStart(2, '0');
  const seconds = String(phTime.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// ===== UNIFIED LOGIN ENDPOINT =====
export const login = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const { username, password, userType } = req.body;
    
    console.log('🔐 Unified Login Attempt:', { 
      hasUsername: !!username,
      hasPassword: !!password,
      hasUserType: !!userType,
      userType,
      passwordLength: password?.length,
      timestamp: new Date().toISOString() 
    });
    
    // Validate required fields
    if (!username || !password || !userType) {
      console.log('❌ Missing required fields:', { username: !!username, password: !!password, userType: !!userType });
      return res.status(400).json({
        success: false,
        message: 'Username, password, and user type are required'
      });
    }
    
    let user = null;
    let tableName = '';
    let userIdField = '';
    let usernameField = '';
    let passwordField = '';
    
    // Determine which table to query based on user type
    switch (userType.toLowerCase()) {
      case 'system_administrator':
        tableName = 'system_administrator';
        userIdField = 'system_admin_id';
        usernameField = 'username';
        passwordField = 'password_hash';
        break;
      case 'stall_business_owner':
        tableName = 'stall_business_owner';
        userIdField = 'business_owner_id';
        usernameField = 'owner_username';
        passwordField = 'owner_password_hash';
        break;
      case 'business_manager':
        tableName = 'business_manager';
        userIdField = 'business_manager_id';
        usernameField = 'manager_username';
        passwordField = 'manager_password_hash';
        break;
      case 'business_employee':
        tableName = 'business_employee';
        userIdField = 'business_employee_id';
        usernameField = 'employee_username';
        passwordField = 'employee_password_hash';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type. Must be system_administrator, stall_business_owner, business_manager, or business_employee'
        });
    }
    
    // Query the appropriate table using stored procedures
    let userRows;
    console.log('🔍 Database Query via Stored Procedure:', { 
      table: tableName, 
      usernameField, 
      hasUsername: !!username 
    });
    
    // Use specific stored procedure for each user type
    switch (userType.toLowerCase()) {
      case 'system_administrator':
        [userRows] = await connection.execute('CALL sp_getSystemAdminByUsername(?)', [username]);
        userRows = userRows[0] || [];
        break;
      case 'stall_business_owner':
        [userRows] = await connection.execute('CALL sp_getBusinessOwnerByUsername(?)', [username]);
        userRows = userRows[0] || [];
        break;
      case 'business_manager':
        [userRows] = await connection.execute('CALL sp_getBusinessManagerByUsername(?)', [username]);
        userRows = userRows[0] || [];
        break;
      case 'business_employee':
        [userRows] = await connection.execute('CALL sp_getBusinessEmployeeByUsername(?)', [username]);
        userRows = userRows[0] || [];
        break;
    }
    
    console.log('📊 Query Results:', { 
      foundUsers: userRows.length
    });
    
    if (userRows.length === 0) {
      console.log(`❌ ${userType} not found or inactive`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account'
      });
    }
    
    user = userRows[0];
    
    // Verify password using the correct password field
    const passwordHash = user[passwordField];
    console.log('🔐 Password Verification:', { 
      userFound: !!user,
      hasPasswordHash: !!passwordHash,
      passwordFieldUsed: passwordField
    });
    
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    console.log('🔓 Password Check Result:', { isPasswordValid });
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for ${userType}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Get additional user information based on type
    let additionalUserInfo = {};
    
    if (userType.toLowerCase() === 'business_manager' || userType.toLowerCase() === 'business_employee') {
      // Get branch information using stored procedure
      const [branchResult] = await connection.execute(
        'CALL sp_getBranchById(?)',
        [user.branch_id]
      );
      const branchRows = branchResult[0] || [];
      
      if (branchRows.length > 0) {
        additionalUserInfo.branch = branchRows[0];
        additionalUserInfo.branchName = branchRows[0].branch_name; // Add branch name directly
      }
      
      // Get employee permissions if user is business employee
      if (userType.toLowerCase() === 'business_employee') {
        // Re-fetch employee data with decryption using stored procedure
        const [empResult] = await connection.execute(
          'CALL getBusinessEmployeeById(?)',
          [user.business_employee_id]
        );
        const employeeDecrypted = empResult[0]?.[0];
        
        if (employeeDecrypted) {
          // Override encrypted data with decrypted data
          user.first_name = employeeDecrypted.first_name;
          user.last_name = employeeDecrypted.last_name;
          user.email = employeeDecrypted.email;
          user.phone_number = employeeDecrypted.phone_number;
          console.log('✅ Employee data decrypted:', { 
            first_name: user.first_name, 
            last_name: user.last_name,
            email: user.email?.substring(0, 5) + '***'
          });
        }
        
        // Parse permissions from JSON if stored as JSON string
        let permissions = {};
        if (user.permissions) {
          try {
            let parsedPerms = typeof user.permissions === 'string' 
              ? JSON.parse(user.permissions) 
              : user.permissions;
            
            // If permissions is an array like ['dashboard', 'applicants'], convert to object
            if (Array.isArray(parsedPerms)) {
              permissions = {};
              parsedPerms.forEach(perm => {
                permissions[perm] = true;
              });
              console.log('✅ Converted array permissions to object:', permissions);
            } else {
              // Already an object
              permissions = parsedPerms;
            }
          } catch (e) {
            console.error('Error parsing employee permissions:', e);
            permissions = {
              read_stalls: user.read_stalls === 1,
              write_stalls: user.write_stalls === 1,
              manage_applicants: user.manage_applicants === 1,
              manage_payments: user.manage_payments === 1,
              view_reports: user.view_reports === 1
            };
          }
        } else {
          // Fallback to individual permission columns
          permissions = {
            read_stalls: user.read_stalls === 1,
            write_stalls: user.write_stalls === 1,
            manage_applicants: user.manage_applicants === 1,
            manage_payments: user.manage_payments === 1,
            view_reports: user.view_reports === 1
          };
        }
        additionalUserInfo.permissions = permissions;
      }
    }
    
    // Get the username from the correct field
    const userUsername = user[usernameField];
    
    // For business_employee, data is already decrypted from getBusinessEmployeeById stored procedure
    // For other user types, decrypt if needed
    let decryptedFirstName = user.first_name;
    let decryptedLastName = user.last_name;
    let decryptedEmail = user.email;
    
    console.log('🔍 [DECRYPT DEBUG] Before decryption:');
    console.log(`  firstName: ${user.first_name ? user.first_name.substring(0, 50) : 'NULL'}`);
    console.log(`  lastName: ${user.last_name ? user.last_name.substring(0, 50) : 'NULL'}`);
    console.log(`  email: ${user.email ? user.email.substring(0, 50) : 'NULL'}`);
    
    if (userType.toLowerCase() !== 'business_employee') {
      decryptedFirstName = decryptSafe(user.first_name);
      decryptedLastName = decryptSafe(user.last_name);
      decryptedEmail = decryptSafe(user.email);
    }
    
    console.log('🔓 [DECRYPT DEBUG] After decryption:');
    console.log(`  firstName: ${decryptedFirstName || 'NULL'}`);
    console.log(`  lastName: ${decryptedLastName || 'NULL'}`);
    console.log(`  email: ${decryptedEmail || 'NULL'}`);
    
    // Create JWT token
    const tokenPayload = {
      userId: user[userIdField],
      userType: userType.toLowerCase(),
      username: userUsername,
      email: decryptedEmail || null,
      firstName: decryptedFirstName || null,
      lastName: decryptedLastName || null,
      branchId: user.branch_id || null,
      permissions: additionalUserInfo.permissions || null
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    console.log('🔐 [LOGIN DEBUG] Creating token with secret (first 20 chars):', jwtSecret.substring(0, 20) + '...');
    console.log('🔐 [LOGIN DEBUG] Token payload:', JSON.stringify(tokenPayload, null, 2));
    
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    console.log('✅ [LOGIN DEBUG] Token created (first 50 chars):', token.substring(0, 50) + '...');
    
    // Prepare user data for response (exclude password)
    const userData = {
      id: user[userIdField],
      userType: userType.toLowerCase(),
      username: userUsername,
      email: decryptedEmail || null,
      firstName: decryptedFirstName,
      lastName: decryptedLastName,
      branchId: user.branch_id || null,
      ...additionalUserInfo
    };
    
    // Update last_login for the user using stored procedures
    try {
      switch (userType.toLowerCase()) {
        case 'system_administrator':
          await connection.execute('CALL sp_updateSystemAdminLastLoginNow(?)', [user[userIdField]]);
          break;
        case 'stall_business_owner':
          await connection.execute('CALL sp_updateBusinessOwnerLastLoginNow(?)', [user[userIdField]]);
          break;
        case 'business_manager':
          await connection.execute('CALL sp_updateBusinessManagerLastLoginNow(?)', [user[userIdField]]);
          break;
        case 'business_employee':
          await connection.execute('CALL sp_updateBusinessEmployeeLastLoginNow(?)', [user[userIdField]]);
          // Also create/update employee session for online status tracking
          try {
            const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await connection.execute('CALL sp_createOrUpdateEmployeeSession(?, ?, ?, ?)', [
              user[userIdField],
              token.substring(0, 255), // session token (truncate if needed)
              ipAddress,
              userAgent
            ]);
            console.log(`✅ Employee session created/updated for: ${userUsername}`);
          } catch (sessionError) {
            console.error('⚠️ Failed to create employee session:', sessionError.message);
          }
          break;
      }
      console.log(`✅ Updated last_login for ${userType}: ${userUsername}`);
    } catch (updateError) {
      console.error('⚠️ Failed to update last_login:', updateError.message);
    }
    
    // Log activity to staff_activity_log using stored procedure
    try {
      // Map userType to staff_type for activity log
      const staffTypeMap = {
        'system_administrator': 'system_administrator',
        'stall_business_owner': 'business_owner',
        'business_manager': 'business_manager',
        'business_employee': 'business_employee'
      };
      const staffType = staffTypeMap[userType.toLowerCase()] || userType.toLowerCase();
      const staffName = `${user.first_name} ${user.last_name}`;
      const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      await connection.execute(
        'CALL sp_logStaffActivityLogin(?, ?, ?, ?, ?, ?)',
        [
          staffType,
          user[userIdField],
          staffName,
          `${staffName} logged in via web`,
          ipAddress,
          userAgent
        ]
      );
      console.log(`✅ Activity logged for ${userType}: ${userUsername}`);
    } catch (logError) {
      console.error('⚠️ Failed to log activity:', logError.message);
    }
    
    console.log(`✅ ${userType} login successful:`, userUsername);
    console.log('📤 Sending user data:', JSON.stringify(userData, null, 2));
    
    res.status(200).json({
      success: true,
      message: `${userType} login successful`,
      data: {
        user: userData,
        token: token
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== VERIFY TOKEN =====
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: decoded,
        isValid: true
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      isValid: false
    });
  }
};

// ===== GET CURRENT USER =====
export const getCurrentUser = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    // Validate that req.user exists and has required fields
    if (!req.user) {
      console.error('❌ req.user is missing');
      return res.status(401).json({
        success: false,
        message: 'Authentication data missing'
      });
    }
    
    const { userId, userType } = req.user;
    
    // Validate required fields
    if (!userId || !userType) {
      console.error('❌ Missing userId or userType:', { userId, userType });
      return res.status(400).json({
        success: false,
        message: 'User ID and type are required'
      });
    }
    
    console.log('🔍 getCurrentUser called with:', { userId, userType });
    
    // Use stored procedures based on user type
    let userRows;
    
    switch (userType) {
      case 'system_administrator':
        {
          const [result] = await connection.execute('CALL sp_getSystemAdminById(?)', [userId]);
          userRows = result[0] || [];
        }
        break;
      case 'stall_business_owner':
        {
          const [result] = await connection.execute('CALL sp_getBusinessOwnerById(?)', [userId]);
          userRows = result[0] || [];
        }
        break;
      case 'business_manager':
        {
          const [result] = await connection.execute('CALL sp_getBusinessManagerWithBranch(?)', [userId]);
          userRows = result[0] || [];
        }
        break;
      case 'business_employee':
        {
          const [result] = await connection.execute('CALL sp_getBusinessEmployeeWithBranch(?)', [userId]);
          userRows = result[0] || [];
        }
        break;
      default:
        console.error('❌ Invalid userType:', userType);
        return res.status(400).json({
          success: false,
          message: `Invalid user type: ${userType}`
        });
    }
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userRows[0];
    
    // Remove password from response
    delete user.password;
    
    // Decrypt sensitive fields for display
    if (user.first_name) user.first_name = decryptSafe(user.first_name);
    if (user.last_name) user.last_name = decryptSafe(user.last_name);
    if (user.email) user.email = decryptSafe(user.email);
    if (user.contact_number) user.contact_number = decryptSafe(user.contact_number);
    if (user.phone_number) user.phone_number = decryptSafe(user.phone_number);
    if (user.address) user.address = decryptSafe(user.address);
    
    console.log('📤 getCurrentUser - Sending data for', userType, ':', JSON.stringify(user, null, 2));
    
    // Return data in the format expected by frontend based on user type
    const responseData = {
      success: true,
      data: user
    };
    
    // Add user-type specific keys for backward compatibility
    if (userType === 'business_manager') {
      responseData.businessManager = user;
    } else if (userType === 'stall_business_owner') {
      responseData.businessOwner = user;
    } else if (userType === 'business_employee') {
      responseData.businessEmployee = user;
    } else if (userType === 'system_administrator') {
      responseData.systemAdministrator = user;
    }
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== LOGOUT =====
export const logout = async (req, res) => {
  let connection;
  
  try {
    // Get user info from JWT token if available
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      
      try {
        const decoded = jwt.verify(token, jwtSecret);
        
        // If user is business_employee, end their session
        if (decoded.userType === 'business_employee' && decoded.userId) {
          connection = await createConnection();
          
          // End employee session
          await connection.execute('CALL sp_endEmployeeSession(?)', [decoded.userId]);
          console.log(`✅ Employee session ended for user ID: ${decoded.userId}`);
          
          // Update last_logout
          await connection.execute('CALL sp_updateBusinessEmployeeLastLogoutNow(?)', [decoded.userId]);
          
          // Log logout activity
          const staffName = `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim() || 'Unknown';
          const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
          const userAgent = req.headers['user-agent'] || 'unknown';
          
          try {
            await connection.execute(
              'CALL sp_logStaffActivityLogout(?, ?, ?, ?, ?, ?)',
              [
                'business_employee',
                decoded.userId,
                staffName,
                `${staffName} logged out`,
                ipAddress,
                userAgent
              ]
            );
          } catch (logError) {
            console.error('⚠️ Failed to log logout activity:', logError.message);
          }
        }
      } catch (tokenError) {
        // Token invalid or expired, continue with logout anyway
        console.log('⚠️ Token verification failed during logout:', tokenError.message);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};