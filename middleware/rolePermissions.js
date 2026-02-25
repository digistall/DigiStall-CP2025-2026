// ===== ROLE PERMISSIONS MIDDLEWARE =====
// Enforces role-based permissions and filtering

import { createConnection } from '../config/database.js';

/**
 * Middleware to enforce VIEW-ONLY access for stall_business_owner role
 * Business owners can only perform GET requests
 */
export const viewOnlyForOwners = (req, res, next) => {
  const userType = req.user?.userType;
  const method = req.method;

  // Business owners can only perform GET requests (read-only)
  if (userType === 'stall_business_owner' && method !== 'GET') {
    console.log(`❌ VIEW-ONLY BLOCK: Business owner attempted ${method} request`);
    return res.status(403).json({
      success: false,
      message: 'Business owners have view-only access. Cannot perform create, update, or delete operations.',
      errorCode: 'VIEW_ONLY_RESTRICTION'
    });
  }

  next();
};

/**
 * Get all branch IDs accessible to a business owner
 * Returns array of branch_ids from business_owner_managers table
 * 
 * @param {Object} req - Express request object with user info
 * @param {Object} connection - Database connection (optional, will create if not provided)
 * @returns {Array|null} Array of branch IDs or null if not a business owner
 */
export const getOwnerBranches = async (req, connection = null) => {
  const userId = req.user?.userId;
  const userType = req.user?.userType;

  // Only applicable to business owners
  if (userType !== 'stall_business_owner') {
    return null;
  }

  let localConnection = connection;
  let shouldCloseConnection = false;

  try {
    // Create connection if not provided
    if (!localConnection) {
      localConnection = await createConnection();
      shouldCloseConnection = true;
    }

    // Get all branches for this owner through their managers using stored procedure
    const [result] = await localConnection.execute(
      `CALL sp_getBranchIdsForOwner(?)`,
      [userId]
    );

    const branches = result[0] || [];
    const branchIds = branches.map(b => b.branch_id);
    console.log(`✅ Business owner ${userId} has access to branches:`, branchIds);
    
    return branchIds;
  } catch (error) {
    console.error('❌ Error getting owner branches:', error);
    throw error;
  } finally {
    // Only close connection if we created it
    if (shouldCloseConnection && localConnection) {
      await localConnection.end();
    }
  }
};

/**
 * Get branch filter based on user role
 * - system_administrator: null (see all)
 * - stall_business_owner: array of branch IDs they own
 * - business_manager: single branch ID
 * - business_employee: single branch ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} connection - Database connection (optional)
 * @returns {Array|null} Array of branch IDs or null for system admins
 */
export const getBranchFilter = async (req, connection = null) => {
  const userType = req.user?.userType;
  const userBranchId = req.user?.branchId;
  const userId = req.user?.userId;

  // Debug logging disabled to prevent console flooding

  // System administrators see everything
  if (userType === 'system_administrator') {
    return null;
  }

  // Business owners see all their branches
  if (userType === 'stall_business_owner') {
    const ownerBranches = await getOwnerBranches(req, connection);
    return ownerBranches;
  }

  // Business managers and employees see only their branch
  if (userType === 'business_manager' || userType === 'business_employee') {
    // If branchId is not in token or is undefined, look it up from database
    if (userBranchId === null || userBranchId === undefined) {
      // branchId not in token, looking up from database
      let localConnection = connection;
      let shouldCloseConnection = false;
      
      try {
        if (!localConnection) {
          localConnection = await createConnection();
          shouldCloseConnection = true;
        }
        
        if (userType === 'business_manager') {
          const [result] = await localConnection.execute(
            'CALL sp_getBranchIdForManager(?)',
            [userId]
          );
          const rows = result[0] || [];
          if (rows.length > 0) {
            const branchId = rows[0].branch_id;
            return [branchId];
          } else {
            console.error('❌ No branch found for business_manager:', userId);
            return []; // Return empty array if no branch found
          }
        } else if (userType === 'business_employee') {
          const [result] = await localConnection.execute(
            'CALL sp_getBranchIdForEmployee(?)',
            [userId]
          );
          const rows = result[0] || [];
          if (rows.length > 0) {
            const branchId = rows[0].branch_id;
            return [branchId];
          } else {
            console.error('❌ No branch found for business_employee:', userId);
            return []; // Return empty array if no branch found
          }
        }
      } catch (dbError) {
        console.error('❌ Database error in getBranchFilter:', dbError);
        throw dbError;
      } finally {
        if (shouldCloseConnection && localConnection) {
          await localConnection.end();
        }
      }
    }
    
    return [userBranchId];
  }

  // Default: restrict to user's branch
  return userBranchId ? [userBranchId] : [];
};

/**
 * Middleware to add branch filtering to request object
 * Sets req.branchFilter for easy access in controllers
 */
export const addBranchFilter = async (req, res, next) => {
  try {
    req.branchFilter = await getBranchFilter(req);
    next();
  } catch (error) {
    console.error('❌ Error adding branch filter:', error);
    res.status(500).json({
      success: false,
      message: 'Error determining branch access',
      error: error.message
    });
  }
};

/**
 * Check if user has permission to access a specific branch
 * 
 * @param {Object} req - Express request object
 * @param {Number} branchId - Branch ID to check
 * @param {Object} connection - Database connection (optional)
 * @returns {Boolean} True if user has access to the branch
 */
export const hasAccessToBranch = async (req, branchId, connection = null) => {
  const branchFilter = await getBranchFilter(req, connection);

  // System admins have access to all branches
  if (branchFilter === null) {
    return true;
  }

  // Check if branchId is in the user's accessible branches
  return branchFilter.includes(branchId);
};

/**
 * Middleware to check permission for specific actions
 * Use this to enforce role-based action permissions
 * 
 * @param {Array} allowedRoles - Array of role names allowed to perform the action
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userType = req.user?.userType;

    if (!allowedRoles.includes(userType)) {
      console.log(`❌ ROLE RESTRICTION: ${userType} not allowed. Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        errorCode: 'ROLE_RESTRICTION'
      });
    }

    next();
  };
};

/**
 * Middleware to block business owners from write operations on specific routes
 */
export const blockOwnerWrites = (req, res, next) => {
  const userType = req.user?.userType;
  const method = req.method;

  if (userType === 'stall_business_owner' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    console.log(`❌ Business owner blocked from ${method} operation`);
    return res.status(403).json({
      success: false,
      message: 'Business owners have view-only access.',
      errorCode: 'VIEW_ONLY_RESTRICTION'
    });
  }

  next();
};


