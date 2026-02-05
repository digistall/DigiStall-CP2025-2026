import { createConnection } from '../../../config/database.js'
import { getBranchFilter } from '../../../middleware/rolePermissions.js'

// Get floors with their sections nested (useful for hierarchical display)
export const getFloorsWithSections = async (req, res) => {
  const userType = req.user?.userType || req.user?.role;
  const userId = req.user?.userId;

  console.log("🏢 GET FLOORS WITH SECTIONS DEBUG:");
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
      // System administrator: Get all floors
      const [result] = await connection.execute(
        `SELECT f.floor_id as id, f.floor_number, f.floor_name as name, 
                f.status, f.created_at, f.branch_id
         FROM floor f
         ORDER BY f.floor_number ASC`
      );
      floors = result;
    } else if (branchFilter.length === 0) {
      // No branches accessible
      floors = [];
    } else if (branchFilter.length === 1) {
      // Single branch (business manager or employee)
      const [result] = await connection.execute(
        `SELECT f.floor_id as id, f.floor_number, f.floor_name as name, 
                f.status, f.created_at, f.branch_id
         FROM floor f
         WHERE f.branch_id = ?
         ORDER BY f.floor_number ASC`,
        [branchFilter[0]]
      );
      floors = result;
    } else {
      // Multiple branches (business owner)
      const placeholders = branchFilter.map(() => '?').join(',');
      const [result] = await connection.execute(
        `SELECT f.floor_id as id, f.floor_number, f.floor_name as name, 
                f.status, f.created_at, f.branch_id
         FROM floor f
         WHERE f.branch_id IN (${placeholders})
         ORDER BY f.floor_number ASC`,
        branchFilter
      );
      floors = result;
    }

    // Get sections for each floor and count stalls
    const floorsWithSections = await Promise.all(
      floors.map(async (floor) => {
        const [sections] = await connection.execute(
          `SELECT s.section_id as id, s.section_name as name,
                  s.status, s.created_at,
                  COUNT(st.stall_id) as stall_count
           FROM section s
           LEFT JOIN stall st ON s.section_id = st.section_id
           WHERE s.floor_id = ?
           GROUP BY s.section_id, s.section_name, s.status, s.created_at
           ORDER BY s.section_name ASC`,
          [floor.id]
        );
        
        return {
          ...floor,
          sections: sections
        };
      })
    );

    console.log(`✅ Found ${floorsWithSections.length} floors with sections for ${userType} (ID: ${userId})`);

    res.json({
      success: true,
      message: "Floors with sections retrieved successfully",
      data: floorsWithSections,
    });
  } catch (err) {
    console.error('Database error:', err);
    res
      .status(500)
      .json({ success: false, message: "Database error", error: err.message });
  } finally {
    if (connection) await connection.end();
  }
};

