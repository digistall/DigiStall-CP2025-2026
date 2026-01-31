/**
 * APPLICANTS - Mobile Backend Services
 * Application-related services for mobile
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * Submit a new application
 * @param {Object} applicationData - Application information
 * @returns {Object} Created application
 */
export const submitApplication = async (applicationData) => {
  let connection;
  try {
    connection = await createConnection();
    
    const {
      applicantId,
      stallId,
      businessName,
      businessType,
      preferredArea,
      documentUrls
    } = applicationData;
    
    const [result] = await connection.execute(
      `INSERT INTO applications (applicant_id, stall_id, business_name, business_type, preferred_area, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [applicantId, stallId, businessName, businessType, preferredArea]
    );
    
    return { 
      application_id: result.insertId, 
      ...applicationData, 
      status: 'pending' 
    };
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get applications by applicant ID
 * @param {number} applicantId - Applicant ID
 * @returns {Array} List of applications
 */
export const getApplicationsByApplicant = async (applicantId) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      `SELECT a.*, s.stall_name, s.stall_number 
       FROM applications a
       LEFT JOIN stalls s ON a.stall_id = s.stall_id
       WHERE a.applicant_id = ?
       ORDER BY a.created_at DESC`,
      [applicantId]
    );
    return results;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get application status
 * @param {number} applicationId - Application ID
 * @returns {Object|null} Application status data
 */
export const getApplicationStatus = async (applicationId) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      'SELECT application_id, status, remarks, updated_at FROM applications WHERE application_id = ?',
      [applicationId]
    );
    return results.length > 0 ? results[0] : null;
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  submitApplication,
  getApplicationsByApplicant,
  getApplicationStatus
};
