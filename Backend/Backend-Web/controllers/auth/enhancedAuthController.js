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

  // Store new refresh token
  const [result] = await connection.execute(
    `INSERT INTO refresh_tokens 
    (user_id, user_type, refresh_token, access_token_jti, device_fingerprint, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, userType, hashedToken, accessTokenJti, deviceFingerprint, ipAddress, userAgent, expiresAt]
  );

  // Log activity
  await connection.execute(
    `INSERT INTO token_activity_log (token_id, user_id, user_type, activity_type, ip_address, user_agent, success)
    VALUES (?, ?, ?, 'login', ?, ?, TRUE)`,
    [result.insertId, userId, userType, ipAddress, userAgent]
  );

  return result.insertId;
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
    
    // Update last login time
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
    
    // Check if token exists and is active in database
    const hashedToken = hashToken(refreshToken);
    const [tokenRows] = await connection.execute(
      `SELECT * FROM refresh_tokens 
      WHERE refresh_token = ? AND is_active = TRUE AND expires_at > NOW()`,
      [hashedToken]
    );
    
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
    
    // Update last used time
    await connection.execute(
      'UPDATE refresh_tokens SET last_used_at = NOW() WHERE token_id = ?',
      [tokenData.token_id]
    );
    
    // Log activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    await connection.execute(
      `INSERT INTO token_activity_log (token_id, user_id, user_type, activity_type, ip_address, user_agent, success)
      VALUES (?, ?, ?, 'refresh', ?, ?, TRUE)`,
      [tokenData.token_id, tokenData.user_id, tokenData.user_type, ipAddress, userAgent]
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
    
    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: 'Already logged out'
      });
    }
    
    // Hash token to find in database
    const hashedToken = hashToken(refreshToken);
    
    // Revoke token
    await connection.execute(
      `UPDATE refresh_tokens 
      SET is_active = FALSE, revoked_at = NOW(), revoke_reason = 'user_logout'
      WHERE refresh_token = ?`,
      [hashedToken]
    );
    
    // Log activity
    const [tokenRows] = await connection.execute(
      'SELECT token_id, user_id, user_type FROM refresh_tokens WHERE refresh_token = ?',
      [hashedToken]
    );
    
    if (tokenRows.length > 0) {
      const tokenData = tokenRows[0];
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      
      await connection.execute(
        `INSERT INTO token_activity_log (token_id, user_id, user_type, activity_type, ip_address, user_agent, success)
        VALUES (?, ?, ?, 'logout', ?, ?, TRUE)`,
        [tokenData.token_id, tokenData.user_id, tokenData.user_type, ipAddress, userAgent]
      );
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

export default {
  login,
  refreshToken,
  logout,
  verifyToken,
  getCurrentUser
};
