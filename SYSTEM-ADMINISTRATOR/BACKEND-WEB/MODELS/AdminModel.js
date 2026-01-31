/**
 * SYSTEM-ADMINISTRATOR - Admin Model
 * Database abstraction for admin operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * AdminModel Class
 * Provides database operations for admin entities
 */
class AdminModel {
  /**
   * Find admin by ID
   * @param {number} adminId - Admin ID
   * @returns {Object|null} Admin data
   */
  static async findById(adminId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM admins WHERE admin_id = ?',
        [adminId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find admin by email
   * @param {string} email - Admin email
   * @returns {Object|null} Admin data
   */
  static async findByEmail(email) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM admins WHERE email = ? AND status = "active"',
        [email]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all admins
   * @returns {Array} List of admins
   */
  static async findAll() {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT admin_id, full_name, email, status, created_at FROM admins ORDER BY created_at DESC'
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new admin
   * @param {Object} data - Admin data
   * @returns {Object} Created admin
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO admins (full_name, email, password_hash, status)
         VALUES (?, ?, ?, 'active')`,
        [data.full_name, data.email, data.password_hash]
      );
      return { admin_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update admin
   * @param {number} adminId - Admin ID
   * @param {Object} data - Update data
   * @returns {boolean} Success status
   */
  static async update(adminId, data) {
    let connection;
    try {
      connection = await createConnection();
      const fields = [];
      const values = [];
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'admin_id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      values.push(adminId);
      
      const [result] = await connection.execute(
        `UPDATE admins SET ${fields.join(', ')} WHERE admin_id = ?`,
        values
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default AdminModel;
