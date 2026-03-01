/**
 * BUSINESS/OWNER-MANAGER - Branch Service
 * Business logic for branch operations
 */

import { createConnection } from '../../../../config/database.js';

/**
 * Get all branches with stats
 * @returns {Array} List of branches with statistics
 */
export const getAllBranchesWithStats = async () => {
  let connection;
  try {
    connection = await createConnection();
    
    const [branches] = await connection.execute(`
      SELECT b.*,
        (SELECT COUNT(*) FROM stalls WHERE branch_id = b.branch_id) as total_stalls,
        (SELECT COUNT(*) FROM stalls WHERE branch_id = b.branch_id AND status = 'occupied') as occupied_stalls,
        (SELECT COUNT(*) FROM stallholders WHERE branch_id = b.branch_id AND status = 'active') as total_stallholders,
        (SELECT COUNT(*) FROM employees WHERE branch_id = b.branch_id AND status = 'active') as total_employees
      FROM branches b
      WHERE b.status = 'active'
      ORDER BY b.created_at DESC
    `);
    
    return branches;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get branch revenue summary
 * @param {number} branchId - Branch ID
 * @param {string} period - Time period (daily, weekly, monthly)
 * @returns {Object} Revenue summary
 */
export const getBranchRevenue = async (branchId, period = 'monthly') => {
  let connection;
  try {
    connection = await createConnection();
    
    let dateFilter = '';
    switch (period) {
      case 'daily':
        dateFilter = 'DATE(payment_date) = CURDATE()';
        break;
      case 'weekly':
        dateFilter = 'YEARWEEK(payment_date) = YEARWEEK(CURDATE())';
        break;
      default:
        dateFilter = 'MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())';
    }
    
    const [[revenue]] = await connection.execute(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as total_payments
      FROM payments p
      JOIN stalls s ON p.stall_id = s.stall_id
      WHERE s.branch_id = ? AND p.status = 'completed' AND ${dateFilter}
    `, [branchId]);
    
    return revenue;
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getAllBranchesWithStats,
  getBranchRevenue
};
