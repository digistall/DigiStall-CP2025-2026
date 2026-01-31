/**
 * BUSINESS/OWNER-MANAGER - Subscription Service
 * Business logic for subscription operations
 */

import { createConnection } from '../../../../CONFIG/database.js';

/**
 * Get subscription summary for dashboard
 * @returns {Object} Subscription statistics
 */
export const getSubscriptionSummary = async () => {
  let connection;
  try {
    connection = await createConnection();
    
    const [[stats]] = await connection.execute(`
      SELECT 
        COUNT(*) as total_subscriptions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as monthly_revenue
      FROM subscriptions
    `);
    
    return stats;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get expiring subscriptions
 * @param {number} days - Days until expiration
 * @returns {Array} List of expiring subscriptions
 */
export const getExpiringSubscriptions = async (days = 30) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [subscriptions] = await connection.execute(`
      SELECT s.*, sh.full_name as stallholder_name
      FROM subscriptions s
      JOIN stallholders sh ON s.stallholder_id = sh.stallholder_id
      WHERE s.status = 'active' 
        AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY s.end_date ASC
    `, [days]);
    
    return subscriptions;
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getSubscriptionSummary,
  getExpiringSubscriptions
};
