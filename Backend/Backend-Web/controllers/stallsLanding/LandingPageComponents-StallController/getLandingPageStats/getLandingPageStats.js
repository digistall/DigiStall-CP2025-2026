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
    
    // Use stored procedure instead of multiple direct SQL queries
    const [rows] = await connection.execute('CALL sp_getLandingPageStats()');
    const statsResult = rows[0][0]; // First row of first result set
    
    const stats = {
      total_stallholders: statsResult?.total_stallholders || 0,
      total_stalls: statsResult?.total_stalls || 0,
      available_stalls: statsResult?.available_stalls || 0,
      occupied_stalls: statsResult?.occupied_stalls || 0
    };
    
    console.log('📊 Landing page stats fetched:', stats);
    
    res.status(200).json({
      success: true,
      data: {
        totalStallholders: stats.total_stallholders,
        totalStalls: stats.total_stalls,
        availableStalls: stats.available_stalls,
        occupiedStalls: stats.occupied_stalls
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
