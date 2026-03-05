import { createConnection } from '../../../../../../config/database.js';

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
    
    // Get comprehensive landing page stats with direct queries
    // Total stalls = ALL stalls in the system (owned and not owned)
    const [totalStallsResult] = await connection.execute(
      'SELECT COUNT(*) as total_stalls FROM stall'
    );
    const [availableStallsResult] = await connection.execute(
      'SELECT COUNT(*) as available_stalls FROM stall WHERE is_available = 1'
    );
    const [totalStallholdersResult] = await connection.execute(
      "SELECT COUNT(*) as total_stallholders FROM stallholder WHERE status = 'active'"
    );
    const [totalBranchesResult] = await connection.execute(
      "SELECT COUNT(*) as total_branches FROM branch WHERE status = 'Active'"
    );
    
    const totalStalls = totalStallsResult[0]?.total_stalls || 0;
    const availableStalls = availableStallsResult[0]?.available_stalls || 0;
    const totalStallholders = totalStallholdersResult[0]?.total_stallholders || 0;
    const totalBranches = totalBranchesResult[0]?.total_branches || 0;
    
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

