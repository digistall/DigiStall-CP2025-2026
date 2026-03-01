/**
 * EMPLOYEE - Inspector Model
 * Database abstraction for inspector-related operations
 */

import { createConnection } from '../../../config/database.js';

/**
 * InspectorModel Class
 * Provides database operations for inspector entities
 */
class InspectorModel {
  /**
   * Find inspector by ID
   * @param {number} inspectorId - Inspector ID
   * @returns {Object|null} Inspector data
   */
  static async findById(inspectorId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM inspectors WHERE inspector_id = ?',
        [inspectorId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find inspectors by branch
   * @param {number} branchId - Branch ID
   * @returns {Array} List of inspectors
   */
  static async findByBranch(branchId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM inspectors WHERE branch_id = ? AND status = "active"',
        [branchId]
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all inspectors
   * @returns {Array} List of all inspectors
   */
  static async findAll() {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM inspectors WHERE status = "active" ORDER BY created_at DESC'
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new inspector
   * @param {Object} data - Inspector data
   * @returns {Object} Created inspector
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO inspectors (full_name, email, contact_number, branch_id, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [data.full_name, data.email, data.contact_number, data.branch_id]
      );
      return { inspector_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update inspector
   * @param {number} inspectorId - Inspector ID
   * @param {Object} data - Update data
   * @returns {boolean} Success status
   */
  static async update(inspectorId, data) {
    let connection;
    try {
      connection = await createConnection();
      const fields = [];
      const values = [];
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      values.push(inspectorId);
      
      const [result] = await connection.execute(
        `UPDATE inspectors SET ${fields.join(', ')} WHERE inspector_id = ?`,
        values
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default InspectorModel;
