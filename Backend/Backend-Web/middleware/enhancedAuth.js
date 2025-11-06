// ===== ENHANCED AUTHENTICATION MIDDLEWARE =====
// JWT verification with Role-Based Access Control (RBAC)
// Features:
// - JWT token validation
// - Role-based authorization
// - Permission-based access control
// - Multiple role support

import jwt from 'jsonwebtoken';
import process from 'process';

const { verify } = jwt;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * Authenticate JWT Token
 * Validates access token and extracts user information
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      requiresAuth: true
    });
  }

  verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ Token verification error:', err);

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          requiresRefresh: true
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          requiresAuth: true
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Token verification failed',
          requiresAuth: true
        });
      }
    }

    // Add decoded user information to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username || `${decoded.firstName} ${decoded.lastName}`,
      email: decoded.email,
      userType: decoded.userType,
      role: decoded.userType, // Alias for backward compatibility
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      branchId: decoded.branchId,
      permissions: decoded.permissions,
      jti: decoded.jti // JWT ID
    };

    console.log('🔍 User authenticated successfully');

    next();
  });
};

/**
 * Role-Based Authorization Middleware
 * Restricts access based on user roles
 * Usage: authorizeRole('admin', 'branch_manager')
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        requiresAuth: true
      });
    }

    const userRole = req.user.userType || req.user.role;

    // Check if user's role is in allowed roles
    const hasRole = allowedRoles.some(role => 
      role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasRole) {
      console.log('❌ Access denied - insufficient role');
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: userRole,
        requiredRoles: allowedRoles,
        accessDenied: true
      });
    }

    console.log('✅ Role authorization passed');
    next();
  };
};

/**
 * Permission-Based Authorization Middleware
 * Restricts access based on specific permissions (for employees)
 * Usage: authorizePermission('manage_applicants', 'manage_payments')
 */
const authorizePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        requiresAuth: true
      });
    }

    const userRole = req.user.userType || req.user.role;

    // Admins and branch managers have all permissions
    if (userRole === 'admin' || userRole === 'branch_manager') {
      console.log(`✅ Permission granted to ${userRole} (admin/manager override)`);
      return next();
    }

    // For employees, check specific permissions
    if (userRole === 'employee') {
      const userPermissions = req.user.permissions || {};
      
      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some(permission => {
        // Handle both object format and array format
        if (typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
          return userPermissions[permission] === true || userPermissions[permission] === 1;
        }
        return userPermissions.includes(permission);
      });

      if (!hasPermission) {
        console.log(`❌ Permission denied for employee. Required: ${requiredPermissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermissions.join(' or ')}`,
          userPermissions: Object.keys(userPermissions).filter(key => userPermissions[key]),
          requiredPermissions: requiredPermissions,
          accessDenied: true
        });
      }

      console.log(`✅ Permission check passed for employee`);
      return next();
    }

    // Unknown role
    console.log(`❌ Access denied for unknown role: ${userRole}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      accessDenied: true
    });
  };
};

/**
 * Combined Role and Permission Authorization
 * Allows access if user has ANY of the specified roles OR permissions
 * Usage: authorizeRoleOrPermission(['admin', 'branch_manager'], ['manage_applicants'])
 */
const authorizeRoleOrPermission = (allowedRoles = [], allowedPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        requiresAuth: true
      });
    }

    const userRole = req.user.userType || req.user.role;

    // Check role first
    const hasRole = allowedRoles.some(role => 
      role.toLowerCase() === userRole.toLowerCase()
    );

    if (hasRole) {
      console.log(`✅ Access granted via role: ${userRole}`);
      return next();
    }

    // Check permissions for employees
    if (userRole === 'employee' && allowedPermissions.length > 0) {
      const userPermissions = req.user.permissions || {};
      
      const hasPermission = allowedPermissions.some(permission => {
        if (typeof userPermissions === 'object' && !Array.isArray(userPermissions)) {
          return userPermissions[permission] === true || userPermissions[permission] === 1;
        }
        return userPermissions.includes(permission);
      });

      if (hasPermission) {
        console.log(`✅ Access granted via permission for employee`);
        return next();
      }
    }

    // Access denied
    console.log(`❌ Access denied for ${userRole}. Required roles: ${allowedRoles.join(', ')} OR permissions: ${allowedPermissions.join(', ')}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient privileges',
      userRole: userRole,
      requiredRoles: allowedRoles,
      requiredPermissions: allowedPermissions,
      accessDenied: true
    });
  };
};

/**
 * Admin Only Middleware
 * Shorthand for admin-only routes
 */
const adminOnly = () => {
  return authorizeRole('admin');
};

/**
 * Branch Manager or Admin Middleware
 * Shorthand for manager/admin routes
 */
const managerOrAdmin = () => {
  return authorizeRole('admin', 'branch_manager');
};

/**
 * Check if user owns the resource (based on branchId)
 * Useful for branch-specific operations
 */
const checkBranchAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      requiresAuth: true
    });
  }

  const userRole = req.user.userType || req.user.role;

  // Admins have access to all branches
  if (userRole === 'admin') {
    return next();
  }

  // For branch managers and employees, check branch match
  const userBranchId = req.user.branchId;
  const requestedBranchId = req.params.branchId || req.body.branchId || req.query.branchId;

  if (!userBranchId) {
    console.log('❌ User has no branch association');
    return res.status(403).json({
      success: false,
      message: 'User not associated with any branch',
      accessDenied: true
    });
  }

  if (requestedBranchId && parseInt(userBranchId) !== parseInt(requestedBranchId)) {
    console.log(`❌ Branch access denied. User branch: ${userBranchId}, Requested: ${requestedBranchId}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own branch data',
      accessDenied: true
    });
  }

  next();
};

/**
 * Optional Authentication
 * Authenticates if token is present, but doesn't fail if missing
 * Useful for routes that work differently for authenticated/unauthenticated users
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      role: decoded.userType,
      branchId: decoded.branchId,
      permissions: decoded.permissions
    };

    next();
  });
};

// Export all middleware functions
export default {
  authenticateToken,
  authorizeRole,
  authorizePermission,
  authorizeRoleOrPermission,
  adminOnly,
  managerOrAdmin,
  checkBranchAccess,
  optionalAuth
};

// Named exports for convenience
export {
  authenticateToken,
  authorizeRole,
  authorizePermission,
  authorizeRoleOrPermission,
  adminOnly,
  managerOrAdmin,
  checkBranchAccess,
  optionalAuth
};
