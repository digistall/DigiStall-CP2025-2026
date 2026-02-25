import { createConnection } from '../../../../config/database.js';

/**
 * Get landing page statistics - Uses stored procedure
 * Returns total active stallholders, total stalls count, available and occupied counts
 * 
 * @route GET /api/stalls/stats
 * @access Public
 */
export const getLandingPageStats = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Use stored procedure
    const [rows] = await connection.execute('CALL getLandingPageStats()');
    const statsResult = rows[0][0]; // First row of first result set
    
    const stats = {
      total_branches: statsResult?.total_branches || 0,
      available_stalls: statsResult?.available_stalls || 0,
      total_stallholders: statsResult?.total_stallholders || 0
    };
    
    console.log('📊 Landing page stats fetched:', stats);
    
    res.status(200).json({
      success: true,
      data: {
        totalBranches: stats.total_branches,
        availableStalls: stats.available_stalls,
        totalStallholders: stats.total_stallholders,
        // For backwards compatibility
        totalStalls: stats.available_stalls,
        occupiedStalls: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching landing page stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch landing page statistics',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

