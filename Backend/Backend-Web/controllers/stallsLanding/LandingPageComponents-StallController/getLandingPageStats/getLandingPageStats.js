import { createConnection } from '../../../../config/database.js';

/**
 * Get landing page statistics
 * Returns total active stallholders, total stalls count, available and occupied counts
 * Uses direct SQL queries for accurate counts based on is_available flag
 * 
 * @route GET /api/stalls/stats
 * @access Public
 */
export const getLandingPageStats = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Get total active stallholders
    const [stallholderResult] = await connection.execute(`
      SELECT COUNT(*) as total_stallholders 
      FROM stallholder 
      WHERE status = 'Active'
    `);
    
    // Get total stalls count
    const [totalStallsResult] = await connection.execute(`
      SELECT COUNT(*) as total_stalls 
      FROM stall
    `);
    
    // Get available stalls count (is_available = 1)
    const [availableResult] = await connection.execute(`
      SELECT COUNT(*) as available_stalls 
      FROM stall 
      WHERE is_available = 1
    `);
    
    // Get occupied stalls count (is_available = 0)
    const [occupiedResult] = await connection.execute(`
      SELECT COUNT(*) as occupied_stalls 
      FROM stall 
      WHERE is_available = 0
    `);
    
    const stats = {
      total_stallholders: stallholderResult[0]?.total_stallholders || 0,
      total_stalls: totalStallsResult[0]?.total_stalls || 0,
      available_stalls: availableResult[0]?.available_stalls || 0,
      occupied_stalls: occupiedResult[0]?.occupied_stalls || 0
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
