import { createConnection } from '../../../config/database.js';

/**
 * Get all branches accessible to the authenticated business owner
 * Returns branch details including ID and name
 */
export const getOwnerBranches = async (req, res) => {
  let connection;
  
  try {
    const userId = req.user?.userId;
    const userType = req.user?.userType;

    console.log('🔍 getOwnerBranches - User:', { userId, userType });

    // Only business owners can call this endpoint
    if (userType !== 'stall_business_owner') {
      return res.status(403).json({
        success: false,
        message: 'Only business owners can access this endpoint'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    connection = await createConnection();

    // Get all branches for this owner through their managers
    const [branches] = await connection.execute(
      `SELECT DISTINCT b.branch_id, b.branch_name, b.location, b.area
       FROM business_owner_managers bom
       INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
       INNER JOIN branch b ON bm.branch_id = b.branch_id
       WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
       ORDER BY b.branch_name`,
      [userId]
    );

    console.log(`✅ Found ${branches.length} branches for business owner ${userId}`);

    res.json({
      success: true,
      message: 'Branches retrieved successfully',
      data: branches
    });

  } catch (error) {
    console.error('❌ getOwnerBranches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve owner branches',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

