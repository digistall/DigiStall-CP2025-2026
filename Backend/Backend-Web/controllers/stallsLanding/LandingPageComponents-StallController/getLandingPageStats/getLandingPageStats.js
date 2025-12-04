import { createConnection } from '../../../../config/database.js';

/**
 * Get landing page statistics
 * Returns total active stallholders and total stalls count
 * Uses stored procedure sp_getLandingPageStats
 * 
 * @route GET /api/stalls/stats
 * @access Public
 */
export const getLandingPageStats = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Call the stored procedure
    const [results] = await connection.execute('CALL sp_getLandingPageStats()');
    
    // The stored procedure returns results in the first element of the array
    const stats = results[0] && results[0][0] ? results[0][0] : {
      total_stallholders: 0,
      total_stalls: 0
    };
    
    console.log('📊 Landing page stats fetched:', stats);
    
    res.status(200).json({
      success: true,
      data: {
        totalStallholders: stats.total_stallholders,
        totalStalls: stats.total_stalls
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
