/**
 * STALL-HOLDER - Mobile Backend Services
 * Stallholder-related services for mobile
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * Get stallholder profile with stall information
 * @param {number} stallholderId - Stallholder ID
 * @returns {Object|null} Stallholder profile data
 */
export const getStallholderProfile = async (stallholderId) => {
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
};

/**
 * Get stallholder's stalls
 * @param {number} stallholderId - Stallholder ID
 * @returns {Array} List of stalls
 */
export const getStallholderStalls = async (stallholderId) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      'SELECT * FROM stalls WHERE stallholder_id = ? AND status = "active"',
      [stallholderId]
    );
    return results;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get payment history for stallholder
 * @param {number} stallholderId - Stallholder ID
 * @param {number} limit - Number of records to return
 * @returns {Array} Payment history
 */
export const getPaymentHistory = async (stallholderId, limit = 50) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      `SELECT * FROM payments 
       WHERE stallholder_id = ? 
       ORDER BY payment_date DESC 
       LIMIT ?`,
      [stallholderId, limit]
    );
    return results;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Submit a complaint
 * @param {Object} complaintData - Complaint information
 * @returns {Object} Created complaint
 */
export const submitComplaint = async (complaintData) => {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      `INSERT INTO complaints (stallholder_id, stall_id, branch_id, subject, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        complaintData.stallholder_id,
        complaintData.stall_id,
        complaintData.branch_id,
        complaintData.subject,
        complaintData.description
      ]
    );
    return { id: result.insertId, ...complaintData, status: 'pending' };
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getStallholderProfile,
  getStallholderStalls,
  getPaymentHistory,
  submitComplaint
};
