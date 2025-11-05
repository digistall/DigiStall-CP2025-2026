// ===== UNIFIED AUTHENTICATION CONTROLLER =====
// Single clean authentication system for all user types

import { createConnection } from '../../config/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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
      case 'admin':
        tableName = 'admin';
        userIdField = 'admin_id';
        usernameField = 'admin_username';
        passwordField = 'admin_password_hash';
        break;
      case 'branch_manager':
        tableName = 'branch_manager';
        userIdField = 'branch_manager_id';
        usernameField = 'manager_username';
        passwordField = 'manager_password_hash';
        break;
      case 'employee':
        tableName = 'employee';
        userIdField = 'employee_id';
        usernameField = 'employee_username';
        passwordField = 'employee_password_hash';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type. Must be admin, branch_manager, or employee'
        });
    }
    
    // Query the appropriate table using USERNAME field
    const query = `SELECT * FROM ${tableName} WHERE ${usernameField} = ? AND status = 'Active'`;
    console.log('🔍 Database Query:', { 
      table: tableName, 
      usernameField, 
      hasUsername: !!username 
    });
    
    const [userRows] = await connection.execute(query, [username]);
    
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
    
    if (userType.toLowerCase() === 'branch_manager' || userType.toLowerCase() === 'employee') {
      // Get branch information with branch name
      const [branchRows] = await connection.execute(
        'SELECT branch_id, branch_name FROM branch WHERE branch_id = ?',
        [user.branch_id]
      );
      
      if (branchRows.length > 0) {
        additionalUserInfo.branch = branchRows[0];
        additionalUserInfo.branchName = branchRows[0].branch_name; // Add branch name directly
      }
      
      // Get employee permissions if user is employee
      if (userType.toLowerCase() === 'employee') {
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
    
    // Create JWT token
    const tokenPayload = {
      userId: user[userIdField],
      userType: userType.toLowerCase(),
      username: userUsername,
      email: user.email || null,
      branchId: user.branch_id || null,
      permissions: additionalUserInfo.permissions || null
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // Prepare user data for response (exclude password)
    const userData = {
      id: user[userIdField],
      userType: userType.toLowerCase(),
      username: userUsername,
      email: user.email || null,
      firstName: user.first_name,
      lastName: user.last_name,
      branchId: user.branch_id || null,
      ...additionalUserInfo
    };
    
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
    
    let tableName = '';
    let userIdField = '';
    
    switch (userType) {
      case 'admin':
        tableName = 'admin';
        userIdField = 'admin_id';
        break;
      case 'branch_manager':
        tableName = 'branch_manager';
        userIdField = 'branch_manager_id';
        break;
      case 'employee':
        tableName = 'employee';
        userIdField = 'employee_id';
        break;
      default:
        console.error('❌ Invalid userType:', userType);
        return res.status(400).json({
          success: false,
          message: `Invalid user type: ${userType}`
        });
    }
    
    // Build query with JOIN to get branch information for employees and branch managers
    let query = `SELECT * FROM ${tableName} WHERE ${userIdField} = ?`;
    let queryParams = [userId];
    
    // For employees and branch managers, join with branch table to get branch name
    if (userType === 'employee' || userType === 'branch_manager') {
      query = `
        SELECT u.*, b.branch_name 
        FROM ${tableName} u
        LEFT JOIN branch b ON u.branch_id = b.branch_id
        WHERE u.${userIdField} = ?
      `;
    }
    
    const [userRows] = await connection.execute(query, queryParams);
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userRows[0];
    
    // Remove password from response
    delete user.password;
    
    console.log('📤 getCurrentUser - Sending data for', userType, ':', JSON.stringify(user, null, 2));
    
    // Return data in the format expected by frontend based on user type
    const responseData = {
      success: true,
      data: user
    };
    
    // Add user-type specific keys for backward compatibility
    if (userType === 'branch_manager') {
      responseData.branchManager = user;
    } else if (userType === 'admin') {
      responseData.admin = user;
    } else if (userType === 'employee') {
      responseData.employee = user;
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
  // Since we're using stateless JWT, logout is handled client-side
  // The client should remove the token from storage
  
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
};