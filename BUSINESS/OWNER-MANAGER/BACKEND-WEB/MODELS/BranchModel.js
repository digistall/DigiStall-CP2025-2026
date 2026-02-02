/**
 * BUSINESS/OWNER-MANAGER - Branch Model
 * Database abstraction for branch operations
 */

import { createConnection } from '../../../../config/database.js';

/**
 * BranchModel Class
 * Provides database operations for branch entities
 */
class BranchModel {
  /**
   * Find branch by ID
   * @param {number} branchId - Branch ID
   * @returns {Object|null} Branch data
   */
  static async findById(branchId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM branches WHERE branch_id = ?',
        [branchId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all branches
   * @param {Object} filters - Filter options
   * @returns {Array} List of branches
   */
  static async findAll(filters = {}) {
    let connection;
    try {
      connection = await createConnection();
      let query = 'SELECT * FROM branches WHERE 1=1';
      const params = [];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.ownerId) {
        query += ' AND owner_id = ?';
        params.push(filters.ownerId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [result] = await connection.execute(query, params);
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new branch
   * @param {Object} data - Branch data
   * @returns {Object} Created branch
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO branches (branch_name, address, owner_id, manager_id, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [data.branch_name, data.address, data.owner_id, data.manager_id]
      );
      return { branch_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update branch
   * @param {number} branchId - Branch ID
   * @param {Object} data - Update data
   * @returns {boolean} Success status
   */
  static async update(branchId, data) {
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
      
      values.push(branchId);
      
      const [result] = await connection.execute(
        `UPDATE branches SET ${fields.join(', ')} WHERE branch_id = ?`,
        values
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Delete branch (soft delete)
   * @param {number} branchId - Branch ID
   * @returns {boolean} Success status
   */
  static async delete(branchId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE branches SET status = "inactive" WHERE branch_id = ?',
        [branchId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default BranchModel;
