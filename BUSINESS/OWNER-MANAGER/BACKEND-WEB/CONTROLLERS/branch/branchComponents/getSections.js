import { createConnection } from '../../../CONFIG/database.js'
import { getBranchFilter } from '../../../MIDDLEWARE/rolePermissions.js'

// Get all sections for authenticated user (branch manager, employee, or business owner)
export const getSections = async (req, res) => {
  const userType = req.user?.userType || req.user?.role;
  const userId = req.user?.userId;

  console.log("🏗️ GET SECTIONS DEBUG:");
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
    
    let sections = [];

    if (branchFilter === null) {
      // System administrator: Get all sections using stored procedure
      const [rows] = await connection.execute('CALL sp_getAllSections()');
      sections = rows[0];
    } else if (branchFilter.length === 0) {
      // No branches accessible
      sections = [];
    } else if (branchFilter.length === 1) {
      // Single branch (business manager or employee) using stored procedure
      const [rows] = await connection.execute(
        'CALL sp_getSectionsByBranch(?)',
        [branchFilter[0]]
      );
      sections = rows[0];
    } else {
      // Multiple branches (business owner) using stored procedure with dynamic SQL
      const branchIds = branchFilter.join(',');
      const [rows] = await connection.execute(
        'CALL sp_getSectionsByBranches(?)',
        [branchIds]
      );
      sections = rows[0];
    }

    console.log(`✅ Found ${sections.length} sections for ${userType} (ID: ${userId})`);

    res.json({
      success: true,
      message: "Sections retrieved successfully",
      data: sections,
    });
  } catch (err) {
    console.error("❌ Get sections error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: err.message 
    });
  } finally {
    if (connection) await connection.end();
  }
};

