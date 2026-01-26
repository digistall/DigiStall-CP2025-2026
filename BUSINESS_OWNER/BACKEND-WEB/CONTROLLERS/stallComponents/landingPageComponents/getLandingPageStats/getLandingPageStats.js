import { createConnection } from '../../../../../../SHARED/CONFIG/database.js';
import { mockStats } from '../../../../../../SHARED/MOCK/mockData.js';

/**
 * Get landing page statistics
 * Returns total active stallholders and total stalls count
 * Uses stored procedure getLandingPageStats
 * 
 * @route GET /api/stalls/stats
 * @access Public
 */
export const getLandingPageStats = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Call the stored procedure (renamed from sp_getLandingPageStats)
    const [results] = await connection.execute('CALL getLandingPageStats()');
    
    // The stored procedure returns results in the first element of the array
    const stats = results[0] && results[0][0] ? results[0][0] : {
      total_branches: 0,
      available_stalls: 0,
      total_stallholders: 0
    };
    
    console.log('ðŸ“Š Landing page stats fetched:', stats);
    
    res.status(200).json({
      success: true,
      data: {
        totalBranches: stats.total_branches,
        availableStalls: stats.available_stalls,
        totalStallholders: stats.total_stallholders,
        totalStalls: stats.available_stalls // backwards compatibility
      }
    });
    
  } catch (error) {
    console.error('âŒ Error fetching landing page stats:', error);
    console.log('📦 Using mock stats for local development');
    
    // Return mock data for local development
    return res.status(200).json({
      success: true,
      data: {
        totalBranches: 4,
        availableStalls: mockStats.availableStalls,
        totalStallholders: mockStats.totalStallholders,
        totalStalls: mockStats.totalStalls
      }
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
