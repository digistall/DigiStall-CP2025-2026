import { getPool } from '../../../../../../config/database.js';
import { withRetry, isTimeoutError } from '../../../../../../utils/dbRetry.js';

/**
 * Get landing page statistics
 * Returns total active stallholders and total stalls count
 * Optimized: Uses single query with subqueries instead of 4 separate queries
 *
 * @route GET /api/stalls/stats
 * @access Public
 */
export const getLandingPageStats = async (req, res) => {
  try {
    const pool = getPool();

    // Execute with retry logic for transient failures
    // Optimized: Single query with subqueries (1 round trip instead of 4)
    const stats = await withRetry(async () => {
      const connection = await pool.getConnection();
      try {
        const [results] = await connection.execute(`
          SELECT
            (SELECT COUNT(*) FROM stall) as total_stalls,
            (SELECT COUNT(*) FROM stall WHERE is_available = 1) as available_stalls,
            (SELECT COUNT(*) FROM stallholder WHERE status = 'active') as total_stallholders,
            (SELECT COUNT(*) FROM branch WHERE status = 'Active') as total_branches
        `);
        return results[0];
      } finally {
        connection.release();
      }
    });

    const totalStalls = stats.total_stalls || 0;
    const availableStalls = stats.available_stalls || 0;
    const totalStallholders = stats.total_stallholders || 0;
    const totalBranches = stats.total_branches || 0;

    console.log('📊 Landing page stats fetched:', { totalStalls, availableStalls, totalStallholders, totalBranches });

    res.status(200).json({
      success: true,
      data: {
        totalBranches: totalBranches,
        availableStalls: availableStalls,
        totalStallholders: totalStallholders,
        totalStalls: totalStalls, // ALL stalls in system (owned + available)
        occupiedStalls: totalStalls - availableStalls
      }
    });

  } catch (error) {
    console.error('❌ Error fetching landing page stats:', error);

    // Return 504 for timeout errors, 500 for others
    const statusCode = isTimeoutError(error) ? 504 : 500;
    const message = isTimeoutError(error)
      ? 'Database connection timed out. Please try again.'
      : 'Failed to fetch landing page statistics';

    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
      code: error.code
    });
  }
};

