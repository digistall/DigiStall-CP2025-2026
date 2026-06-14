// ===== UNIFIED AUTHENTICATION CONTROLLER =====
// Email-based login with AES-256-GCM encrypted passwords

import { createConnection } from '../../../config/database.js'
import jwt from 'jsonwebtoken'
import { decryptData, encryptData } from '../../../services/encryptionService.js'

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

// ===== UNIFIED LOGIN ENDPOINT WITH AUTO-DETECTION =====
// Email-based login - auto-detects user type
export const login = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // DO NOT encrypt email - it's stored as plain text for searching
    const searchEmail = email; // Use plain email to search
    
    // Try each user type until we find a match
    const userTypes = [
      {
        type: 'system_administrator',
        procedure: 'getSystemAdminByEmail',
        idField: 'system_admin_id',
        passwordField: 'admin_password'
      },
      {
        type: 'stall_business_owner',
        procedure: 'getBusinessOwnerByEmail',
        idField: 'business_owner_id',
        passwordField: 'owner_password'
      },
      {
        type: 'business_manager',
        procedure: 'getBusinessManagerByEmail',
        idField: 'business_manager_id',
        passwordField: 'manager_password'
      },
      {
        type: 'business_employee',
        procedure: 'getBusinessEmployeeByEmail',
        idField: 'business_employee_id',
        passwordField: 'employee_password'
      },
      {
        type: 'inspector',
        procedure: 'getInspectorByEmail',
        idField: 'inspector_id',
        passwordField: 'password'
      },
      {
        type: 'collector',
        procedure: 'getCollectorByEmail',
        idField: 'collector_id',
        passwordField: 'password'
      }
    ];

    let user = null;
    let detectedUserType = null;
    let userConfig = null;

    // Try each user type
    for (const config of userTypes) {
      try {
        const [userRows] = await connection.execute(`CALL ${config.procedure}(?)`, [searchEmail]);
        const users = userRows[0] || [];
        
        if (users.length > 0) {
          user = users[0];
          detectedUserType = config.type;
          userConfig = config;
          break;
        }
      } catch (error) {
        // Continue to next user type
      }
    }

    if (!user || !detectedUserType) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account'
      });
    }
    
    // Decrypt the stored password and compare with provided password
    const encryptedPassword = user[userConfig.passwordField];
    
    try {
      const decryptedStoredPassword = decryptData(encryptedPassword);
      const isPasswordValid = password === decryptedStoredPassword;
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } catch (decryptError) {
      console.error('❌ Error decrypting password:', decryptError.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
    
    // Get additional user information based on type
    let additionalUserInfo = {};
    
    if (detectedUserType === 'business_manager' || detectedUserType === 'business_employee') {
      // Get branch information using stored procedure
      const [branchResult] = await connection.execute(
        'CALL getBranchById(?)',
        [user.branch_id]
      );
      const branchRows = branchResult[0] || [];
      
      if (branchRows.length > 0) {
        additionalUserInfo.branch = branchRows[0];
        additionalUserInfo.branchName = branchRows[0].branch_name; // Add branch name directly
      }
      
      // Get employee permissions if user is business employee
      if (detectedUserType === 'business_employee') {
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
          // Employee data decrypted successfully
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
    
    // For business_employee, data is already decrypted from getBusinessEmployeeById stored procedure
    // For other user types, decrypt if needed
    let decryptedFirstName = user.first_name;
    let decryptedLastName = user.last_name;
    let decryptedEmail = user.email;
    
    // Always decrypt names - stored procedures may not decrypt properly
    decryptedFirstName = decryptSafe(user.first_name);
    decryptedLastName = decryptSafe(user.last_name);
    // Email is stored plain text - don't decrypt
    decryptedEmail = user.email;
    
    // Create JWT token
    const tokenPayload = {
      userId: user[userConfig.idField],
      userType: detectedUserType,
      email: decryptedEmail || null,
      firstName: decryptedFirstName || null,
      lastName: decryptedLastName || null,
      branchId: user.branch_id || null,
      permissions: additionalUserInfo.permissions || null
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '15m' });
    
    const refreshToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    await connection.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user[userConfig.idField], refreshToken, expiresAt]
    );

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Prepare user data for response (exclude password)
    const userData = {
      id: user[userConfig.idField],
      userType: detectedUserType,
      email: decryptedEmail || null,
      firstName: decryptedFirstName,
      lastName: decryptedLastName,
      fullName: `${decryptedFirstName || ''} ${decryptedLastName || ''}`.trim(),
      branchId: user.branch_id || null,
      ...additionalUserInfo
    };
    
    // Update last_login - try stored procedures, silent fail if not implemented
    try {
      const phTime = getPhilippineTime();
      switch (detectedUserType) {
        case 'system_administrator':
          await connection.execute('UPDATE system_administrator SET last_login = ? WHERE system_admin_id = ?', 
            [phTime, user[userConfig.idField]]);
          break;
        case 'stall_business_owner':
          await connection.execute('UPDATE stall_business_owner SET last_login = ? WHERE business_owner_id = ?', 
            [phTime, user[userConfig.idField]]);
          break;
        case 'business_manager':
          await connection.execute('UPDATE business_manager SET last_login = ? WHERE business_manager_id = ?', 
            [phTime, user[userConfig.idField]]);
          break;
        case 'business_employee':
          await connection.execute('UPDATE business_employee SET last_login = ? WHERE business_employee_id = ?', 
            [phTime, user[userConfig.idField]]);
          // Also create employee session for online status tracking
          try {
            // First deactivate any existing sessions
            await connection.execute(`
              UPDATE employee_session SET is_active = 0, logout_time = ? 
              WHERE employee_id = ? AND is_active = 1
            `, [phTime, user[userConfig.idField]]);
            // Create new session
            await connection.execute(`
              INSERT INTO employee_session (employee_id, session_token, login_time, last_heartbeat, is_active) 
              VALUES (?, ?, ?, ?, 1)
            `, [user[userConfig.idField], token, phTime, phTime]);
          } catch (sessionError) {
            // Silence session error
          }
          break;
      }
    } catch (updateError) {
      // Silence update error
    }
    
    // Log the login activity
    try {
      const { logStaffActivity } = await import('../activityLog/staffActivityLogController.js');
      await logStaffActivity({
        staffType: detectedUserType,
        staffId: user[userConfig.idField],
        staffName: `${decryptedFirstName} ${decryptedLastName}`.trim(),
        branchId: user.branch_id || null,
        actionType: 'LOGIN',
        actionDescription: `${decryptedFirstName} ${decryptedLastName} logged in via web`,
        module: 'Auth',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        status: 'success'
      });
    } catch (logError) {
    }

    res.status(200).json({
      success: true,
      message: `${detectedUserType} login successful`,
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
    
    // Get current user details
    
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
          // Fetch full manager details joined with branch
          const [result] = await connection.execute(`
            SELECT 
              bm.*, 
              b.branch_name, 
              b.area, 
              b.location as branch_location,
              b.address as branch_address
            FROM business_manager bm
            LEFT JOIN branch b ON bm.branch_id = b.branch_id
            WHERE bm.business_manager_id = ?
          `, [userId]);
          
          // Query success
          
          // Result might be an array of objects
          if (Array.isArray(result)) {
            userRows = result;
          } else {
            userRows = [result];
          }
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
    
    // Decrypt sensitive fields for display (handles both camelCase and snake_case based on SP return)
    const fieldsToDecrypt = [
      'first_name', 'firstName', 
      'last_name', 'lastName', 
      'email', 
      'contact_number', 'contactNumber',
      'phone_number', 'phoneNumber',
      'address'
    ];
    
    fieldsToDecrypt.forEach(field => {
      if (user[field]) {
        user[field] = decryptSafe(user[field]);
      }
    });
    
    // Ensure both cases are available for frontend compatibility
    if (user.firstName && !user.first_name) user.first_name = user.firstName;
    if (user.lastName && !user.last_name) user.last_name = user.lastName;
    if (user.contactNumber && !user.contact_number) user.contact_number = user.contactNumber;
    if (user.phoneNumber && !user.phone_number) user.phone_number = user.phoneNumber;
    
    // Ensure userType is included in the user object
    user.userType = userType;
    
    // Return data
    
    // Return data in the format expected by frontend based on user type
    const responseData = {
      success: true,
      data: user
    };
    
    // Add user-type specific keys for backward compatibility
    // Add expanded business statistics for Managers and Employees
    if (userType === 'business_manager' || userType === 'business_employee') {
      const bId = user.branch_id || user.branchId;
      if (bId) {
        try {
          // Fetch aggregate business stats for this branch
          
          // 1. Managed Stalls count
          const [stallsResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM stall WHERE branch_id = ?',
            [bId]
          );
          
          // 2. Total Approved Revenue (Regular + Penalty)
          const [regRevenueResult] = await connection.execute(
            'SELECT SUM(amount) as total FROM payments WHERE branch_id = ? AND status = "Approved"',
            [bId]
          );
          
          const [penRevenueResult] = await connection.execute(
            'SELECT SUM(pp.amount) as total FROM penalty_payments pp JOIN stallholder sh ON pp.stallholder_id = sh.stallholder_id WHERE sh.branch_id = ?',
            [bId]
          );
          
          const totalRevenue = (parseFloat(regRevenueResult[0]?.total) || 0) + (parseFloat(penRevenueResult[0]?.total) || 0);

          // 3. Active Personnel count
          const [employeesResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM business_employee WHERE branch_id = ? AND status = "Active"',
            [bId]
          );

          // 4. Active Stallholders count
          const [stallholdersResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM stallholder WHERE branch_id = ? AND status = "Active"',
            [bId]
          );

          // 5. Pending Applications count
          const [appsResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM application a JOIN stall s ON a.stall_id = s.stall_id WHERE s.branch_id = ? AND a.status = "Pending"',
            [bId]
          );

          user.stats = {
            managedStalls: stallsResult[0]?.count || 0,
            totalRevenue: totalRevenue,
            activePersonnel: employeesResult[0]?.count || 0,
            activeStallholders: stallholdersResult[0]?.count || 0,
            pendingApplications: appsResult[0]?.count || 0
          };
          
        } catch (statsError) {
          user.stats = { managedStalls: 0, totalRevenue: 0, activePersonnel: 0, activeStallholders: 0, pendingApplications: 0 };
        }
      }
    }

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
          }
        }
      } catch (tokenError) {
        // Token invalid or expired, continue with logout anyway
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

// ===== UPDATE PROFILE =====
export const updateProfile = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication data missing'
      });
    }
    
    const { userId, userType } = req.user;
    const { firstName, lastName, phone, address, dob, gender } = req.body;
    
    
    // Encrypt sensitive fields (consistent with system encryption)
    const encryptedFirstName = encryptData(firstName);
    const encryptedLastName = encryptData(lastName);
    const encryptedPhone = encryptData(phone);
    const encryptedAddress = encryptData(address);
    
    const phTime = getPhilippineTime();
    
    // Convert dob string to MySQL format if provided
    const formattedDob = dob ? new Date(dob).toISOString().split('T')[0] : null;

    // Direct SQL update per user type
    switch (userType) {
      case 'system_administrator':
        await connection.execute(
          `UPDATE system_administrator SET first_name = ?, last_name = ?, contact_number = ?, date_of_birth = ?, gender = ?, updated_at = ? WHERE system_admin_id = ?`,
          [encryptedFirstName, encryptedLastName, encryptedPhone, formattedDob, gender, phTime, userId]
        );
        break;
      case 'stall_business_owner':
        await connection.execute(
          `UPDATE stall_business_owner SET first_name = ?, last_name = ?, contact_number = ?, address = ?, date_of_birth = ?, gender = ?, updated_at = ? WHERE business_owner_id = ?`,
          [encryptedFirstName, encryptedLastName, encryptedPhone, encryptedAddress, formattedDob, gender, phTime, userId]
        );
        break;
      case 'business_manager':
        await connection.execute(
          `UPDATE business_manager SET first_name = ?, last_name = ?, contact_number = ?, address = ?, date_of_birth = ?, gender = ?, updated_at = ? WHERE business_manager_id = ?`,
          [encryptedFirstName, encryptedLastName, encryptedPhone, encryptedAddress, formattedDob, gender, phTime, userId]
        );
        break;
      case 'business_employee':
        await connection.execute(
          `UPDATE business_employee SET first_name = ?, last_name = ?, phone_number = ?, address = ?, date_of_birth = ?, gender = ?, updated_at = ? WHERE business_employee_id = ?`,
          [encryptedFirstName, encryptedLastName, encryptedPhone, encryptedAddress, formattedDob, gender, phTime, userId]
        );
        break;
      default:
        return res.status(400).json({ success: false, message: `Invalid user type: ${userType}` });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
