import { createConnection } from '../../../CONFIG/database.js'
import { getBranchFilter } from '../../../MIDDLEWARE/rolePermissions.js'

// Get all floors for authenticated user (branch manager, employee, or business owner)
export const getFloors = async (req, res) => {
  const userType = req.user?.userType || req.user?.role;
  const userId = req.user?.userId;

  console.log("🏢 GET FLOORS DEBUG:");
  console.log("- User Type:", userType);
  console.log("- User ID:", userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID not found in authentication token",
    });
  }

  let connection;
  try {
    connection = await createConnection();
    
    // Get branch filter based on user role
    const branchFilter = await getBranchFilter(req, connection);
    
    let floors = [];

    if (branchFilter === null) {
      // System administrator: Get all floors using stored procedure
      const [rows] = await connection.execute('CALL sp_getAllFloors()');
      floors = rows[0];
    } else if (branchFilter.length === 0) {
      // No branches accessible
      floors = [];
    } else if (branchFilter.length === 1) {
      // Single branch (business manager or employee) using stored procedure
      const [rows] = await connection.execute(
        'CALL sp_getFloorsByBranch(?)',
        [branchFilter[0]]
      );
      floors = rows[0];
    } else {
      // Multiple branches (business owner) using stored procedure with dynamic SQL
      const branchIds = branchFilter.join(',');
      const [rows] = await connection.execute(
        'CALL sp_getFloorsByBranches(?)',
        [branchIds]
      );
      floors = rows[0];
    }

    console.log(`✅ Found ${floors.length} floors for ${userType} (ID: ${userId})`);

    res.json({
      success: true,
      message: "Floors retrieved successfully",
      data: floors,
    });
  } catch (err) {
    console.error("❌ Get floors error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: err.message 
    });
  } finally {
    if (connection) await connection.end();
  }
};

