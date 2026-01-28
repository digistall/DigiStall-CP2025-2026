/**
 * APPLICANTS - Web Backend Services
 * Application-related services for web dashboard
 */

import { createConnection } from '../../../CONFIG/database.js';
import { encryptData, decryptData } from '../../../SERVICES/encryptionService.js';
import emailService from '../../../SERVICES/emailService.js';

/**
 * Get all applicants with decryption
 * @param {Object} filters - Filter options
 * @returns {Array} List of decrypted applicants
 */
export const getAllApplicants = async (filters = {}) => {
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
    
    const [results] = await connection.execute(query, params);
    return results.map(decryptApplicantFields);
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Decrypt applicant sensitive fields
 * @param {Object} applicant - Applicant data
 * @returns {Object} Applicant with decrypted fields
 */
export const decryptApplicantFields = (applicant) => {
  try {
    return {
      ...applicant,
      full_name: applicant.full_name ? decryptData(applicant.full_name) : null,
      email: applicant.email ? decryptData(applicant.email) : null,
      contact_number: applicant.contact_number ? decryptData(applicant.contact_number) : null,
      address: applicant.address ? decryptData(applicant.address) : null,
    };
  } catch (error) {
    return applicant;
  }
};

/**
 * Approve an applicant
 * @param {number} applicantId - Applicant ID
 * @param {Object} approvalData - Approval information
 * @returns {boolean} Success status
 */
export const approveApplicant = async (applicantId, approvalData) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [result] = await connection.execute(
      `UPDATE applicants SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE applicant_id = ?`,
      [approvalData.approvedBy, applicantId]
    );
    
    // Send approval email
    if (result.affectedRows > 0 && approvalData.email) {
      await emailService.sendApprovalNotification(approvalData.email, approvalData);
    }
    
    return result.affectedRows > 0;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Decline an applicant
 * @param {number} applicantId - Applicant ID
 * @param {Object} declineData - Decline information
 * @returns {boolean} Success status
 */
export const declineApplicant = async (applicantId, declineData) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [result] = await connection.execute(
      `UPDATE applicants SET status = 'declined', decline_reason = ?, declined_by = ?, declined_at = NOW() WHERE applicant_id = ?`,
      [declineData.reason, declineData.declinedBy, applicantId]
    );
    
    return result.affectedRows > 0;
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getAllApplicants,
  decryptApplicantFields,
  approveApplicant,
  declineApplicant
};
