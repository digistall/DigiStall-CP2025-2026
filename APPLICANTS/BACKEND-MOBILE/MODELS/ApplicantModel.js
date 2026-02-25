/**
 * APPLICANTS - Applicant Model
 * Database abstraction for applicant-related operations
 */

import { createConnection } from '../../../config/database.js';

/**
 * ApplicantModel Class
 * Provides database operations for applicant entities
 */
class ApplicantModel {
  /**
   * Find applicant by ID
   * @param {number} applicantId - Applicant ID
   * @returns {Object|null} Applicant data
   */
  static async findById(applicantId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM applicants WHERE applicant_id = ?',
        [applicantId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all applicants
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
      
      query += ' ORDER BY created_at DESC';
      
      const [result] = await connection.execute(query, params);
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new applicant
   * @param {Object} data - Applicant data
   * @returns {Object} Created applicant
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO applicants (full_name, email, contact_number, address, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [data.full_name, data.email, data.contact_number, data.address]
      );
      return { applicant_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update applicant status
   * @param {number} applicantId - Applicant ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional update data
   * @returns {boolean} Success status
   */
  static async updateStatus(applicantId, status, additionalData = {}) {
    let connection;
    try {
      connection = await createConnection();
      let query = 'UPDATE applicants SET status = ?';
      const params = [status];
      
      if (additionalData.approvedBy) {
        query += ', approved_by = ?, approved_at = NOW()';
        params.push(additionalData.approvedBy);
      }
      
      if (additionalData.declinedBy) {
        query += ', declined_by = ?, declined_at = NOW(), decline_reason = ?';
        params.push(additionalData.declinedBy, additionalData.reason || '');
      }
      
      query += ' WHERE applicant_id = ?';
      params.push(applicantId);
      
      const [result] = await connection.execute(query, params);
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default ApplicantModel;
