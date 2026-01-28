/**
 * STALL-HOLDER - Payment Model
 * Database abstraction for payment-related operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * PaymentModel Class
 * Provides database operations for payment entities
 */
class PaymentModel {
  /**
   * Find payment by ID
   * @param {number} paymentId - Payment ID
   * @returns {Object|null} Payment data
   */
  static async findById(paymentId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM payments WHERE payment_id = ?',
        [paymentId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get payments by stallholder
   * @param {number} stallholderId - Stallholder ID
   * @param {number} limit - Number of records
   * @returns {Array} List of payments
   */
  static async findByStallholder(stallholderId, limit = 50) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `SELECT * FROM payments 
         WHERE stallholder_id = ? 
         ORDER BY payment_date DESC 
         LIMIT ?`,
        [stallholderId, limit]
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get upcoming payments for stallholder
   * @param {number} stallholderId - Stallholder ID
   * @returns {Array} List of upcoming payments
   */
  static async getUpcoming(stallholderId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `SELECT * FROM payments 
         WHERE stallholder_id = ? AND status = 'pending' AND due_date >= CURDATE()
         ORDER BY due_date ASC`,
        [stallholderId]
      );
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create payment record
   * @param {Object} data - Payment data
   * @returns {Object} Created payment
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO payments (stallholder_id, stall_id, amount, payment_type, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [data.stallholder_id, data.stall_id, data.amount, data.payment_type]
      );
      return { payment_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default PaymentModel;
