/**
 * BUSINESS/OWNER-MANAGER - Subscription Model
 * Database abstraction for subscription operations
 */

import { createConnection } from '../../../../CONFIG/database.js';

/**
 * SubscriptionModel Class
 * Provides database operations for subscription entities
 */
class SubscriptionModel {
  /**
   * Find subscription by ID
   * @param {number} subscriptionId - Subscription ID
   * @returns {Object|null} Subscription data
   */
  static async findById(subscriptionId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM subscriptions WHERE subscription_id = ?',
        [subscriptionId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all subscriptions
   * @param {Object} filters - Filter options
   * @returns {Array} List of subscriptions
   */
  static async findAll(filters = {}) {
    let connection;
    try {
      connection = await createConnection();
      let query = 'SELECT * FROM subscriptions WHERE 1=1';
      const params = [];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.stallholderId) {
        query += ' AND stallholder_id = ?';
        params.push(filters.stallholderId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [result] = await connection.execute(query, params);
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new subscription
   * @param {Object} data - Subscription data
   * @returns {Object} Created subscription
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO subscriptions (stallholder_id, plan_type, amount, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [data.stallholder_id, data.plan_type, data.amount, data.start_date, data.end_date]
      );
      return { subscription_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update subscription status
   * @param {number} subscriptionId - Subscription ID
   * @param {string} status - New status
   * @returns {boolean} Success status
   */
  static async updateStatus(subscriptionId, status) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE subscriptions SET status = ? WHERE subscription_id = ?',
        [status, subscriptionId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Cancel subscription
   * @param {number} subscriptionId - Subscription ID
   * @returns {boolean} Success status
   */
  static async cancel(subscriptionId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE subscriptions SET status = "cancelled", cancelled_at = NOW() WHERE subscription_id = ?',
        [subscriptionId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default SubscriptionModel;
