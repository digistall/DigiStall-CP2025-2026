/**
 * APPLICANTS - Web Applicant Model
 * Database abstraction for web applicant operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * WebApplicantModel Class
 * Provides database operations for web applicant management
 */
class WebApplicantModel {
  /**
   * Get all applicants with filters
   * @param {Object} filters - Filter options
   * @returns {Array} List of applicants
   */
  static async findAll(filters = {}) {
    let connection;
    try {
      connection = await createConnection();
      let query = 'SELECT * FROM applicants WHERE 1=1';
      const params = [];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.branchId) {
        query += ' AND branch_id = ?';
        params.push(filters.branchId);
      }
      
      if (filters.search) {
        query += ' AND (full_name LIKE ? OR email LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      const [result] = await connection.execute(query, params);
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get applicants by branch manager
   * @param {number} branchId - Branch ID
   * @returns {Array} List of applicants
   */
  static async findByBranchManager(branchId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM applicants WHERE branch_id = ? ORDER BY created_at DESC',
        [branchId]
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Approve applicant
   * @param {number} applicantId - Applicant ID
   * @param {number} approvedBy - User who approved
   * @returns {boolean} Success status
   */
  static async approve(applicantId, approvedBy) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `UPDATE applicants SET status = 'approved', approved_by = ?, approved_at = NOW() 
         WHERE applicant_id = ?`,
        [approvedBy, applicantId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Decline applicant
   * @param {number} applicantId - Applicant ID
   * @param {number} declinedBy - User who declined
   * @param {string} reason - Decline reason
   * @returns {boolean} Success status
   */
  static async decline(applicantId, declinedBy, reason) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `UPDATE applicants SET status = 'declined', declined_by = ?, declined_at = NOW(), decline_reason = ?
         WHERE applicant_id = ?`,
        [declinedBy, reason, applicantId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Delete applicant (soft delete)
   * @param {number} applicantId - Applicant ID
   * @returns {boolean} Success status
   */
  static async delete(applicantId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE applicants SET status = "deleted" WHERE applicant_id = ?',
        [applicantId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default WebApplicantModel;
