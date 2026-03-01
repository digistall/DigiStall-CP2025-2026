/**
 * SYSTEM-ADMINISTRATOR - Admin Controller
 * Handles system administration operations
 */

import { createConnection } from '../../../config/database.js';
import { encryptData, decryptData } from '../../../services/encryptionService.js';

/**
 * Get system dashboard statistics
 * @route GET /api/admin/dashboard
 * @access Admin only
 */
export const getDashboardStats = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    // Get various counts
    const [[branchCount]] = await connection.execute('SELECT COUNT(*) as count FROM branches WHERE status = "active"');
    const [[stallCount]] = await connection.execute('SELECT COUNT(*) as count FROM stalls WHERE status = "active"');
    const [[stallholderCount]] = await connection.execute('SELECT COUNT(*) as count FROM stallholders WHERE status = "active"');
    const [[employeeCount]] = await connection.execute('SELECT COUNT(*) as count FROM employees WHERE status = "active"');
    const [[applicantCount]] = await connection.execute('SELECT COUNT(*) as count FROM applicants WHERE status = "pending"');
    
    return res.status(200).json({
      success: true,
      data: {
        branches: branchCount.count,
        stalls: stallCount.count,
        stallholders: stallholderCount.count,
        employees: employeeCount.count,
        pendingApplicants: applicantCount.count
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics'
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all users (admins, managers, employees)
 * @route GET /api/admin/users
 * @access Admin only
 */
export const getAllUsers = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { userType, status } = req.query;
    
    let query = '';
    let params = [];
    
    switch (userType) {
      case 'admin':
        query = 'SELECT * FROM admins WHERE 1=1';
        break;
      case 'manager':
        query = 'SELECT * FROM branch_managers WHERE 1=1';
        break;
      case 'employee':
        query = 'SELECT * FROM employees WHERE 1=1';
        break;
      default:
        // Get all user types
        return res.status(200).json({
          success: true,
          message: 'Please specify userType parameter'
        });
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [users] = await connection.execute(query, params);
    
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get system activity logs
 * @route GET /api/admin/activity-logs
 * @access Admin only
 */
export const getActivityLogs = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { limit = 100, offset = 0 } = req.query;
    
    const [logs] = await connection.execute(
      `SELECT * FROM activity_logs 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    
    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get activity logs'
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get system settings
 * @route GET /api/admin/settings
 * @access Admin only
 */
export const getSystemSettings = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const [settings] = await connection.execute('SELECT * FROM system_settings');
    
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting system settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get system settings'
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Update system settings
 * @route PUT /api/admin/settings
 * @access Admin only
 */
export const updateSystemSettings = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { key, value } = req.body;
    
    const [result] = await connection.execute(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );
    
    return res.status(200).json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getDashboardStats,
  getAllUsers,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings
};
