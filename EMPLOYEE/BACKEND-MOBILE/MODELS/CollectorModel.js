/**
 * EMPLOYEE - Collector Model
 * Database abstraction for collector-related operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * CollectorModel Class
 * Provides database operations for collector entities
 */
class CollectorModel {
  /**
   * Find collector by ID
   * @param {number} collectorId - Collector ID
   * @returns {Object|null} Collector data
   */
  static async findById(collectorId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM collectors WHERE collector_id = ?',
        [collectorId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find collectors by branch
   * @param {number} branchId - Branch ID
   * @returns {Array} List of collectors
   */
  static async findByBranch(branchId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM collectors WHERE branch_id = ? AND status = "active"',
        [branchId]
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all collectors
   * @returns {Array} List of all collectors
   */
  static async findAll() {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM collectors WHERE status = "active" ORDER BY created_at DESC'
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new collector
   * @param {Object} data - Collector data
   * @returns {Object} Created collector
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO collectors (full_name, email, contact_number, branch_id, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [data.full_name, data.email, data.contact_number, data.branch_id]
      );
      return { collector_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default CollectorModel;
