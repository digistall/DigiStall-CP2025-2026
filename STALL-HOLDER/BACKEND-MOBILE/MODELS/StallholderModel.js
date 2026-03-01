/**
 * STALL-HOLDER - Stallholder Model
 * Database abstraction for stallholder-related operations
 */

import { createConnection } from '../../../config/database.js';

/**
 * StallholderModel Class
 * Provides database operations for stallholder entities
 */
class StallholderModel {
  /**
   * Find stallholder by ID
   * @param {number} stallholderId - Stallholder ID
   * @returns {Object|null} Stallholder data
   */
  static async findById(stallholderId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM stallholders WHERE stallholder_id = ?',
        [stallholderId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find stallholders by branch
   * @param {number} branchId - Branch ID
   * @returns {Array} List of stallholders
   */
  static async findByBranch(branchId) {
    let connection;
    try {
      connection = await createConnection();
      const [results] = await connection.execute(
        'CALL getStallholdersByBranchDecrypted(?)',
        [branchId]
      );
      return results[0] || [];
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get stallholder profile with stall info
   * @param {number} stallholderId - Stallholder ID
   * @returns {Object|null} Complete stallholder profile
   */
  static async getProfile(stallholderId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'CALL sp_getStallholderDetailsForComplaintDecrypted(?)',
        [stallholderId]
      );
      return result[0]?.[0] || null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update stallholder profile
   * @param {number} stallholderId - Stallholder ID
   * @param {Object} data - Update data
   * @returns {boolean} Success status
   */
  static async update(stallholderId, data) {
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
      
      values.push(stallholderId);
      
      const [result] = await connection.execute(
        `UPDATE stallholders SET ${fields.join(', ')} WHERE stallholder_id = ?`,
        values
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default StallholderModel;
