import { createConnection } from '../../../config/database.js'

// Get stall by ID using stored procedure
export const getStallById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in authentication token',
      });
    }

    connection = await createConnection();

    // Use stored procedure to get stall details
    const [stallResult] = await connection.execute(
      `CALL sp_getStallById(?)`,
      [id]
    );

    // The result is in the first element of the array
    const stalls = stallResult[0];

    if (!stalls || stalls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found',
      });
    }

    const stall = stalls[0];

    // Verify user has permission to view this stall
    if (userType === 'business_manager') {
      const businessManagerId = req.user?.businessManagerId || userId;
      if (stall.created_by_business_manager !== businessManagerId) {
        // Check if stall belongs to manager's branch
        const [managerCheck] = await connection.execute(
          `SELECT bm.business_manager_id 
           FROM business_manager bm
           WHERE bm.branch_id = ? AND bm.business_manager_id = ?`,
          [stall.branch_id, businessManagerId]
        );
        
        if (managerCheck.length === 0) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this stall',
          });
        }
      }
    } else if (userType === 'business_employee') {
      // Check if employee's branch matches stall's branch
      if (stall.branch_id !== branchId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this stall',
        });
      }
    }

    res.json({
      success: true,
      message: 'Stall retrieved successfully',
      data: stall
    });

  } catch (error) {
    console.error('❌ Get stall by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stall',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};