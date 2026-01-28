/**
 * SYSTEM-ADMINISTRATOR - Admin Service
 * Business logic for admin operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * Get comprehensive system statistics
 * @returns {Object} System statistics
 */
export const getSystemStats = async () => {
  let connection;
  try {
    connection = await createConnection();
    
    const stats = {};
    
    // Branch stats
    const [[branchStats]] = await connection.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
       FROM branches`
    );
    stats.branches = branchStats;
    
    // Stall stats
    const [[stallStats]] = await connection.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
       FROM stalls`
    );
    stats.stalls = stallStats;
    
    // User stats
    const [[userStats]] = await connection.execute(
      `SELECT 
        (SELECT COUNT(*) FROM admins WHERE status = 'active') as admins,
        (SELECT COUNT(*) FROM branch_managers WHERE status = 'active') as managers,
        (SELECT COUNT(*) FROM employees WHERE status = 'active') as employees,
        (SELECT COUNT(*) FROM stallholders WHERE status = 'active') as stallholders`
    );
    stats.users = userStats;
    
    return stats;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Log activity
 * @param {Object} logData - Activity log data
 * @returns {boolean} Success status
 */
export const logActivity = async (logData) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO activity_logs (user_id, user_type, action, description, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        logData.userId,
        logData.userType,
        logData.action,
        logData.description,
        logData.ipAddress || null
      ]
    );
    
    return result.affectedRows > 0;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get setting value
 * @param {string} key - Setting key
 * @returns {string|null} Setting value
 */
export const getSetting = async (key) => {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      [key]
    );
    return result.length > 0 ? result[0].setting_value : null;
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getSystemStats,
  logActivity,
  getSetting
};
