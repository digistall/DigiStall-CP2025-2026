/**
 * APPLICANTS - Application Model
 * Database abstraction for application-related operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * ApplicationModel Class
 * Provides database operations for application entities
 */
class ApplicationModel {
  /**
   * Find application by ID
   * @param {number} applicationId - Application ID
   * @returns {Object|null} Application data
   */
  static async findById(applicationId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM applications WHERE application_id = ?',
        [applicationId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get applications by applicant
   * @param {number} applicantId - Applicant ID
   * @returns {Array} List of applications
   */
  static async findByApplicant(applicantId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `SELECT a.*, s.stall_name, s.stall_number 
         FROM applications a
         LEFT JOIN stalls s ON a.stall_id = s.stall_id
         WHERE a.applicant_id = ?
         ORDER BY a.created_at DESC`,
        [applicantId]
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new application
   * @param {Object} data - Application data
   * @returns {Object} Created application
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO applications (applicant_id, stall_id, business_name, business_type, preferred_area, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [data.applicant_id, data.stall_id, data.business_name, data.business_type, data.preferred_area]
      );
      return { application_id: result.insertId, ...data, status: 'pending' };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update application status
   * @param {number} applicationId - Application ID
   * @param {string} status - New status
   * @param {string} remarks - Optional remarks
   * @returns {boolean} Success status
   */
  static async updateStatus(applicationId, status, remarks = null) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE applications SET status = ?, remarks = ?, updated_at = NOW() WHERE application_id = ?',
        [status, remarks, applicationId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default ApplicationModel;
