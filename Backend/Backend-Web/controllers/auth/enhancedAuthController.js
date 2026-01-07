// ===== ENHANCED JWT AUTHENTICATION CONTROLLER =====
// Complete JWT auth with refresh tokens and single device login
// Features:
// - Access token (5 minutes) + Refresh token (30 days)
// - Single device login per account
// - Automatic token refresh
// - Role-based access control

import { createConnection } from '../../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
const ACCESS_TOKEN_EXPIRY = '5m'; // 5 minutes
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

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

// ===== HELPER FUNCTIONS =====

/**
 * Generate device fingerprint from request
 */
const generateDeviceFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const acceptLanguage = req.headers['accept-language'] || '';
  
  return crypto
    .createHash('sha256')
    .update(`${userAgent}${ip}${acceptLanguage}`)
    .digest('hex');
};

/**
 * Hash refresh token before storing in database
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate JWT tokens (access + refresh)
 */
const generateTokens = (payload) => {
  // Access Token (short-lived)
  const accessToken = jwt.sign(
    {
      ...payload,
      type: 'access',
      jti: crypto.randomUUID() // JWT ID for tracking
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Refresh Token (long-lived)
  const refreshToken = jwt.sign(
    {
      userId: payload.userId,
      userType: payload.userType,
      type: 'refresh',
      jti: crypto.randomUUID()
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

/**
 * Store refresh token in database
 */
const storeRefreshToken = async (connection, userId, userType, refreshToken, req, accessTokenJti) => {
  const hashedToken = hashToken(refreshToken);
  const deviceFingerprint = generateDeviceFingerprint(req);
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // First, revoke all existing tokens for this user (single device login)
  await connection.execute(
    'CALL revokeAllUserTokens(?, ?, ?)',
    [userId, userType, 'new_login']
  );

  // Store new refresh token using stored procedure
  const [result] = await connection.execute(
    'CALL sp_storeRefreshToken(?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, userType, hashedToken, accessTokenJti, deviceFingerprint, ipAddress, userAgent, expiresAt]
  );

  const tokenId = result[0]?.[0]?.token_id;

  // Log activity using stored procedure
  await connection.execute(
    'CALL sp_logTokenActivity(?, ?, ?, ?, ?, ?, ?)',
    [tokenId, userId, userType, 'login', ipAddress, userAgent, true]
  );

  return tokenId;
};

// ===== AUTHENTICATION ENDPOINTS =====

/**
 * LOGIN - Generate access and refresh tokens
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const { email, password, userType } = req.body;
    
    console.log('🔐 Login Attempt:', { email, userType, timestamp: new Date().toISOString() });
    
    // Validate required fields
    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and user type are required'
      });
    }
    
    // Determine which table to query
    let tableName = '';
    let userIdField = '';
    
    switch (userType.toLowerCase()) {
      case 'admin':
        tableName = 'admin';
        userIdField = 'admin_id';
        break;
      case 'branch_manager':
        tableName = 'branch_manager';
        userIdField = 'manager_id';
        break;
      case 'employee':
        tableName = 'employee';
        userIdField = 'employee_id';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type. Must be admin, branch_manager, or employee'
        });
    }
    
    // Query the appropriate table
    const [userRows] = await connection.execute(
      `SELECT * FROM ${tableName} WHERE email = ? AND status = 'Active'`,
      [email]
    );
    
    if (userRows.length === 0) {
      console.log(`❌ ${userType} not found or inactive:`, email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account'
      });
    }
    
    const user = userRows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for ${userType}:`, email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Get additional user information based on type
    let additionalUserInfo = {};
    
    if (userType.toLowerCase() === 'branch_manager' || userType.toLowerCase() === 'employee') {
      // Get branch information
      const [branchRows] = await connection.execute(
        'SELECT branch_id, branch_name, area, location FROM branch WHERE branch_id = ?',
        [user.branch_id]
      );
      
      if (branchRows.length > 0) {
        additionalUserInfo.branch = branchRows[0];
        additionalUserInfo.branchName = branchRows[0].branch_name;
      }
      
      // Get employee permissions if user is employee
      if (userType.toLowerCase() === 'employee') {
        let permissions = {};
        if (user.permissions) {
          try {
            permissions = typeof user.permissions === 'string' 
              ? JSON.parse(user.permissions) 
              : user.permissions;
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
        }
        additionalUserInfo.permissions = permissions;
      }
    }
    
    // Create JWT token payload
    const tokenPayload = {
      userId: user[userIdField],
      userType: userType.toLowerCase(),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      branchId: user.branch_id || null,
      permissions: additionalUserInfo.permissions || null,
      role: userType.toLowerCase() // For backward compatibility
    };
    
    // Generate access and refresh tokens
    const { accessToken, refreshToken } = generateTokens(tokenPayload);
    
    // Decode access token to get JTI
    const decodedAccessToken = jwt.decode(accessToken);
    
    // Store refresh token in database
    await storeRefreshToken(
      connection,
      user[userIdField],
      userType.toLowerCase(),
      refreshToken,
      req,
      decodedAccessToken.jti
    );
    
    // Update last login time with UTC (consistent with mobile)
    await connection.execute(
      `UPDATE ${tableName} SET last_login = NOW() WHERE ${userIdField} = ?`,
      [user[userIdField]]
    );
    
    // Prepare user data for response (exclude password)
    const userData = {
      id: user[userIdField],
      userType: userType.toLowerCase(),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      branchId: user.branch_id || null,
      ...additionalUserInfo
    };
    
    console.log(`✅ ${userType} login successful:`, email);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: userData,
      tokenExpiry: {
        accessToken: '5 minutes',
        refreshToken: '30 days'
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * REFRESH TOKEN - Generate new access token using refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      console.error('❌ Invalid refresh token:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        requiresLogin: true
      });
    }
    
    // Check if token exists and is active in database using stored procedure
    const hashedToken = hashToken(refreshToken);
    const [tokenResult] = await connection.execute(
      'CALL sp_getActiveRefreshToken(?)',
      [hashedToken]
    );
    const tokenRows = tokenResult[0] || [];
    
    if (tokenRows.length === 0) {
      console.log('❌ Refresh token not found or expired in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        requiresLogin: true
      });
    }
    
    const tokenData = tokenRows[0];
    
    // Get user data based on user type
    let tableName = '';
    let userIdField = '';
    
    switch (tokenData.user_type) {
      case 'admin':
        tableName = 'admin';
        userIdField = 'admin_id';
        break;
      case 'branch_manager':
        tableName = 'branch_manager';
        userIdField = 'manager_id';
        break;
      case 'employee':
        tableName = 'employee';
        userIdField = 'employee_id';
        break;
    }
    
    // Get fresh user data
    const [userRows] = await connection.execute(
      `SELECT * FROM ${tableName} WHERE ${userIdField} = ? AND status = 'Active'`,
      [tokenData.user_id]
    );
    
    if (userRows.length === 0) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'User account not found or inactive',
        requiresLogin: true
      });
    }
    
    const user = userRows[0];
    
    // Get additional user information
    let additionalUserInfo = {};
    
    if (tokenData.user_type === 'branch_manager' || tokenData.user_type === 'employee') {
      const [branchRows] = await connection.execute(
        'SELECT branch_id, branch_name, area, location FROM branch WHERE branch_id = ?',
        [user.branch_id]
      );
      
      if (branchRows.length > 0) {
        additionalUserInfo.branch = branchRows[0];
        additionalUserInfo.branchName = branchRows[0].branch_name;
      }
      
      if (tokenData.user_type === 'employee') {
        let permissions = {};
        if (user.permissions) {
          try {
            permissions = typeof user.permissions === 'string' 
              ? JSON.parse(user.permissions) 
              : user.permissions;
          } catch (e) {
            permissions = {};
          }
        }
        additionalUserInfo.permissions = permissions;
      }
    }
    
    // Create new access token payload
    const tokenPayload = {
      userId: user[userIdField],
      userType: tokenData.user_type,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      branchId: user.branch_id || null,
      permissions: additionalUserInfo.permissions || null,
      role: tokenData.user_type
    };
    
    // Generate new access token
    const accessToken = jwt.sign(
      {
        ...tokenPayload,
        type: 'access',
        jti: crypto.randomUUID()
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    // Update last used time using stored procedure
    await connection.execute(
      'CALL sp_updateRefreshTokenLastUsed(?)',
      [tokenData.token_id]
    );
    
    // Log activity using stored procedure
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    await connection.execute(
      'CALL sp_logTokenActivity(?, ?, ?, ?, ?, ?, ?)',
      [tokenData.token_id, tokenData.user_id, tokenData.user_type, 'refresh', ipAddress, userAgent, true]
    );
    
    console.log('✅ Token refreshed successfully for user:', tokenData.user_id);
    
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      user: {
        id: user[userIdField],
        userType: tokenData.user_type,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        branchId: user.branch_id || null,
        ...additionalUserInfo
      }
    });
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during token refresh',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * LOGOUT - Revoke refresh token
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    // Get user info from multiple sources - try body first, then req.user
    // Body may contain 'userId' or 'id' depending on frontend
    let userId = req.body?.userId || req.body?.id || req.user?.userId || req.user?.id;
    let userType = req.body?.userType || req.user?.userType;
    
    // Convert userId to number if it's a string
    if (userId && typeof userId === 'string') {
      userId = parseInt(userId, 10);
    }
    
    console.log('='.repeat(60));
    console.log('📤 WEB LOGOUT REQUEST RECEIVED');
    console.log('📤 Timestamp:', new Date().toISOString());
    console.log('📤 req.body:', JSON.stringify(req.body, null, 2));
    console.log('📤 req.user:', JSON.stringify(req.user, null, 2));
    console.log('📤 req.cookies:', JSON.stringify(req.cookies, null, 2));
    console.log('📤 Extracted values:');
    console.log('   - userId:', userId, '(type:', typeof userId, ')');
    console.log('   - userType:', userType);
    console.log('   - hasRefreshToken:', !!refreshToken);
    console.log('='.repeat(60));
    
    const philippineTime = getPhilippineTime();
    console.log('📤 Philippine time for logout:', philippineTime);
    
    // Update last_logout for the user based on their type using stored procedures
    if (userId && userType) {
      const normalizedUserType = userType.toLowerCase().trim();
      console.log('📤 Normalized userType:', normalizedUserType);
      
      try {
        let checkRows = [];
        let result = null;
        
        switch (normalizedUserType) {
          case 'business_employee':
          case 'employee':
            {
              const [checkResult] = await connection.execute('CALL sp_checkBusinessEmployeeExists(?)', [userId]);
              checkRows = checkResult[0] || [];
              if (checkRows.length > 0) {
                [result] = await connection.execute('CALL sp_updateBusinessEmployeeLastLogout(?, ?)', [userId, philippineTime]);
                // Also deactivate the employee session for online status tracking
                try {
                  await connection.execute(`
                    UPDATE employee_session 
                    SET is_active = 0, 
                        logout_time = ?,
                        last_activity = ?
                    WHERE business_employee_id = ? 
                      AND is_active = 1
                  `, [philippineTime, philippineTime, userId]);
                  console.log(`✅ Employee session deactivated for ID ${userId}`);
                } catch (sessionError) {
                  console.error('⚠️ Failed to deactivate employee session:', sessionError.message);
                }
              }
            }
            break;
          case 'business_manager':
          case 'branch_manager':
          case 'manager':
            {
              const [checkResult] = await connection.execute('CALL sp_checkBusinessManagerExists(?)', [userId]);
              checkRows = checkResult[0] || [];
              if (checkRows.length > 0) {
                [result] = await connection.execute('CALL sp_updateBusinessManagerLastLogout(?, ?)', [userId, philippineTime]);
              }
            }
            break;
          case 'stall_business_owner':
          case 'business_owner':
          case 'owner':
            {
              const [checkResult] = await connection.execute('CALL sp_checkBusinessOwnerExists(?)', [userId]);
              checkRows = checkResult[0] || [];
              if (checkRows.length > 0) {
                [result] = await connection.execute('CALL sp_updateBusinessOwnerLastLogout(?, ?)', [userId, philippineTime]);
              }
            }
            break;
          case 'system_administrator':
          case 'admin':
          case 'system_admin':
            {
              const [checkResult] = await connection.execute('CALL sp_checkSystemAdminExists(?)', [userId]);
              checkRows = checkResult[0] || [];
              if (checkRows.length > 0) {
                [result] = await connection.execute('CALL sp_updateSystemAdminLastLogout(?, ?)', [userId, philippineTime]);
              }
            }
            break;
          default:
            console.error(`❌ Unhandled userType: "${normalizedUserType}"`);
            break;
        }
        
        console.log(`📤 User check: found ${checkRows.length} row(s)`);
        
        if (checkRows.length === 0) {
          console.warn(`⚠️ User ${userId} not found`);
        } else {
          const affectedRows = result?.[0]?.[0]?.affected_rows || 0;
          console.log(`✅ UPDATE RESULT: affectedRows: ${affectedRows}`);
          
          if (affectedRows === 0) {
            console.warn(`⚠️ No rows affected! User ${userId} may not exist or last_logout column missing`);
          } else {
            console.log(`✅ Successfully updated last_logout for ${userType} ID ${userId} to ${philippineTime}`);
            
            // Log logout activity to staff_activity_log
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
            const userAgent = req.headers['user-agent'] || '';
            
            try {
              // Get staff name for logging
              let staffName = 'Unknown';
              switch (normalizedUserType) {
                case 'business_employee':
                case 'employee':
                  {
                    const [nameResult] = await connection.execute(
                      'SELECT CONCAT(first_name, " ", last_name) as name FROM business_employee WHERE business_employee_id = ?', 
                      [userId]
                    );
                    if (nameResult[0]?.name) staffName = nameResult[0].name;
                  }
                  break;
                case 'business_manager':
                case 'branch_manager':
                case 'manager':
                  {
                    const [nameResult] = await connection.execute(
                      'SELECT CONCAT(first_name, " ", last_name) as name FROM business_manager WHERE business_manager_id = ?', 
                      [userId]
                    );
                    if (nameResult[0]?.name) staffName = nameResult[0].name;
                  }
                  break;
                case 'stall_business_owner':
                case 'business_owner':
                case 'owner':
                  {
                    const [nameResult] = await connection.execute(
                      'SELECT CONCAT(first_name, " ", last_name) as name FROM stall_business_owner WHERE business_owner_id = ?', 
                      [userId]
                    );
                    if (nameResult[0]?.name) staffName = nameResult[0].name;
                  }
                  break;
                case 'system_administrator':
                case 'admin':
                case 'system_admin':
                  {
                    const [nameResult] = await connection.execute(
                      'SELECT CONCAT(first_name, " ", last_name) as name FROM system_administrator WHERE system_admin_id = ?', 
                      [userId]
                    );
                    if (nameResult[0]?.name) staffName = nameResult[0].name;
                  }
                  break;
              }
              
              // Log to staff_activity_log
              await connection.execute(
                'CALL sp_logStaffActivityLogout(?, ?, ?, ?, ?, ?, ?)',
                [normalizedUserType, userId, staffName, null, `${staffName} logged out via web`, ipAddress, userAgent]
              );
              console.log(`📝 Logout activity logged for ${normalizedUserType} ${staffName}`);
            } catch (logError) {
              console.warn('⚠️ Failed to log logout activity:', logError.message);
            }
          }
        }
      } catch (updateError) {
        console.error('❌ DATABASE ERROR updating last_logout:');
        console.error('   - Error message:', updateError.message);
        console.error('   - Error code:', updateError.code);
        console.error('   - SQL state:', updateError.sqlState);
        console.error('   - Full error:', updateError);
      }
    } else {
      console.warn('⚠️ Missing required data for logout:');
      console.warn('   - userId:', userId || '(missing)');
      console.warn('   - userType:', userType || '(missing)');
    }
    
    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: 'Already logged out'
      });
    }
    
    // Hash token to find in database
    const hashedToken = hashToken(refreshToken);
    
    // Revoke token using stored procedure
    await connection.execute(
      'CALL sp_revokeRefreshTokenByHash(?, ?)',
      [hashedToken, 'user_logout']
    );
    
    // Log activity using stored procedure
    const [tokenResult] = await connection.execute(
      'CALL sp_getRefreshTokenByHash(?)',
      [hashedToken]
    );
    const tokenRows = tokenResult[0] || [];
    
    if (tokenRows.length > 0) {
      const tokenData = tokenRows[0];
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      await connection.execute(
        'CALL sp_logTokenActivity(?, ?, ?, ?, ?, ?, ?)',
        [tokenData.token_id, tokenData.user_id, tokenData.user_type, 'logout', ipAddress, userAgent, true]
      );
      
      // Also update last_logout if we have token data using stored procedures
      if (!userId && tokenData.user_id && tokenData.user_type) {
        try {
          switch (tokenData.user_type.toLowerCase()) {
            case 'business_employee':
            case 'employee':
              await connection.execute('CALL sp_updateBusinessEmployeeLastLogout(?, ?)', [tokenData.user_id, philippineTime]);
              break;
            case 'business_manager':
            case 'branch_manager':
            case 'manager':
              await connection.execute('CALL sp_updateBusinessManagerLastLogout(?, ?)', [tokenData.user_id, philippineTime]);
              break;
            case 'stall_business_owner':
            case 'business_owner':
            case 'owner':
              await connection.execute('CALL sp_updateBusinessOwnerLastLogout(?, ?)', [tokenData.user_id, philippineTime]);
              break;
            case 'system_administrator':
            case 'admin':
            case 'system_admin':
              await connection.execute('CALL sp_updateSystemAdminLastLogout(?, ?)', [tokenData.user_id, philippineTime]);
              break;
          }
          console.log(`✅ Updated last_logout for ${tokenData.user_type} ${tokenData.user_id} from token data`);
        } catch (updateError) {
          console.warn('Could not update last_logout from token:', updateError.message);
        }
      }
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    console.log('✅ User logged out successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * VERIFY TOKEN - Check if access token is valid
 * GET /api/auth/verify-token
 */
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        valid: false
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
          valid: false,
          requiresRefresh: err.name === 'TokenExpiredError'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        valid: true,
        user: {
          userId: decoded.userId,
          userType: decoded.userType,
          email: decoded.email
        }
      });
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying token',
      valid: false
    });
  }
};

/**
 * GET CURRENT USER - Get current authenticated user info
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User info is already in req.user from auth middleware
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting user information'
    });
  }
};

/**
 * HEARTBEAT - Update last_login to keep user marked as "online"
 * POST /api/auth/heartbeat
 * This endpoint is called periodically by the frontend to indicate activity
 */
export const heartbeat = async (req, res) => {
  let connection;
  
  try {
    const { userId, userType } = req.body;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or userType'
      });
    }
    
    connection = await createConnection();
    const philippineTime = getPhilippineTime();
    
    // Update last_login using stored procedures based on userType
    switch (userType) {
      case 'business_employee':
        await connection.execute('CALL sp_heartbeatBusinessEmployee(?, ?)', [userId, philippineTime]);
        break;
      case 'business_manager':
        await connection.execute('CALL sp_heartbeatBusinessManager(?, ?)', [userId, philippineTime]);
        break;
      case 'stall_business_owner':
        await connection.execute('CALL sp_heartbeatBusinessOwner(?, ?)', [userId, philippineTime]);
        break;
      case 'system_administrator':
        await connection.execute('CALL sp_heartbeatSystemAdmin(?, ?)', [userId, philippineTime]);
        break;
      case 'inspector':
        await connection.execute('CALL sp_heartbeatInspector(?, ?)', [userId, philippineTime]);
        break;
      case 'collector':
        await connection.execute('CALL sp_heartbeatCollector(?, ?)', [userId, philippineTime]);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown user type: ${userType}`
        });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Heartbeat recorded',
      timestamp: philippineTime
    });
    
  } catch (error) {
    console.error('❌ Heartbeat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error recording heartbeat',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * AUTO-LOGOUT - Handle automatic logout due to inactivity
 * POST /api/auth/auto-logout
 * This logs the auto-logout event and updates the user's session status
 */
export const autoLogout = async (req, res) => {
  let connection;
  
  try {
    const { userId, userType, reason } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    console.log('='.repeat(60));
    console.log('⏰ AUTO-LOGOUT REQUEST RECEIVED');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('⏰ userId:', userId, 'userType:', userType, 'reason:', reason);
    console.log('='.repeat(60));
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or userType'
      });
    }
    
    connection = await createConnection();
    const philippineTime = getPhilippineTime();
    
    // Use stored procedures for auto-logout based on userType
    const normalizedUserType = userType.toLowerCase().trim();
    
    try {
      switch (normalizedUserType) {
        case 'business_employee':
        case 'employee':
          await connection.execute('CALL sp_autoLogoutBusinessEmployee(?, ?, ?, ?)', 
            [userId, philippineTime, ipAddress, userAgent]);
          console.log(`✅ Auto-logout recorded for business_employee ${userId}`);
          break;
          
        case 'business_manager':
        case 'branch_manager':
        case 'manager':
          await connection.execute('CALL sp_autoLogoutBusinessManager(?, ?, ?, ?)', 
            [userId, philippineTime, ipAddress, userAgent]);
          console.log(`✅ Auto-logout recorded for business_manager ${userId}`);
          break;
          
        case 'stall_business_owner':
        case 'business_owner':
        case 'owner':
          // For business owner, just log the activity and update last_logout
          await connection.execute('CALL sp_updateBusinessOwnerLastLogout(?, ?)', [userId, philippineTime]);
          await connection.execute(`
            INSERT INTO staff_activity_log 
            (staff_type, staff_id, staff_name, action_type, action_description, module, ip_address, user_agent, status, created_at)
            SELECT 'business_owner', ?, CONCAT(first_name, ' ', last_name), 'AUTO_LOGOUT',
                   CONCAT(first_name, ' ', last_name, ' was automatically logged out due to 5 minutes of inactivity'),
                   'authentication', ?, ?, 'success', ?
            FROM stall_business_owner WHERE business_owner_id = ?
          `, [userId, ipAddress, userAgent, philippineTime, userId]);
          console.log(`✅ Auto-logout recorded for business_owner ${userId}`);
          break;
          
        case 'system_administrator':
        case 'admin':
        case 'system_admin':
          await connection.execute('CALL sp_updateSystemAdminLastLogout(?, ?)', [userId, philippineTime]);
          await connection.execute(`
            INSERT INTO staff_activity_log 
            (staff_type, staff_id, staff_name, action_type, action_description, module, ip_address, user_agent, status, created_at)
            SELECT 'system_administrator', ?, CONCAT(first_name, ' ', last_name), 'AUTO_LOGOUT',
                   CONCAT(first_name, ' ', last_name, ' was automatically logged out due to 5 minutes of inactivity'),
                   'authentication', ?, ?, 'success', ?
            FROM system_administrator WHERE system_admin_id = ?
          `, [userId, ipAddress, userAgent, philippineTime, userId]);
          console.log(`✅ Auto-logout recorded for system_administrator ${userId}`);
          break;
          
        case 'inspector':
          await connection.execute('CALL sp_autoLogoutInspector(?, ?, ?, ?)', 
            [userId, philippineTime, ipAddress, userAgent]);
          console.log(`✅ Auto-logout recorded for inspector ${userId}`);
          break;
          
        case 'collector':
          await connection.execute('CALL sp_autoLogoutCollector(?, ?, ?, ?)', 
            [userId, philippineTime, ipAddress, userAgent]);
          console.log(`✅ Auto-logout recorded for collector ${userId}`);
          break;
          
        default:
          console.warn(`⚠️ Unknown userType for auto-logout: ${normalizedUserType}`);
      }
    } catch (dbError) {
      console.error('❌ Database error during auto-logout:', dbError.message);
      // Continue anyway - we still want to log out the user
    }
    
    return res.status(200).json({
      success: true,
      message: 'Auto-logout recorded successfully',
      timestamp: philippineTime
    });
    
  } catch (error) {
    console.error('❌ Auto-logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error recording auto-logout',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export default {
  login,
  refreshToken,
  logout,
  verifyToken,
  getCurrentUser,
  heartbeat,
  autoLogout
};
