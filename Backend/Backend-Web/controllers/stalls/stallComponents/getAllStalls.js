import { createConnection } from "../../../config/database.js";
import { getBranchFilter } from "../../../middleware/rolePermissions.js";

// Get all stalls for the authenticated user (branch manager or employee with stalls permission)
export const getAllStalls = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log("🔍 getAllStalls - User details:", {
      userType,
      userId,
      branchId: req.user?.branchId,
      permissions: req.user?.permissions,
    });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Get branch filter based on user role
    const branchFilter = await getBranchFilter(req, connection);

    let stalls = [];

    // Handle different user types
    if (branchFilter === null) {
      // System administrator - see all stalls across all branches
      console.log("🔍 getAllStalls - System admin viewing all branches");
      const [result] = await connection.execute(
        `SELECT 
          s.*,
          s.stall_id as id,
          sec.section_name,
          f.floor_name,
          f.floor_number,
          b.area,
          b.location as branch_location,
          b.branch_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE s.status != 'Inactive' AND s.is_available = 1
        ORDER BY s.created_at DESC`
      );
      stalls = result;
    } else if (branchFilter.length === 0) {
      // Business owner with no accessible branches
      console.log("⚠️ getAllStalls - Business owner has no accessible branches");
      stalls = [];
    } else if (userType === "business_manager" || userType === "stall_business_owner") {
      // Business manager or business owner: Get stalls for accessible branches
      console.log(`🔍 getAllStalls - Fetching stalls for branches: ${branchFilter.join(', ')}`);
      
      const placeholders = branchFilter.map(() => '?').join(',');
      const query = `SELECT 
        s.*,
        s.stall_id as id,
        sec.section_name,
        f.floor_name,
        f.floor_number,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name,
        b.area,
        b.location as branch_location,
        b.branch_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
      WHERE b.branch_id IN (${placeholders}) AND s.status != 'Inactive' AND s.is_available = 1
      ORDER BY s.created_at DESC`;
      
      const [result] = await connection.execute(query, branchFilter);
      stalls = result;
    } else if (userType === "business_employee") {
      // Employee: Check permissions first
      const permissions = req.user?.permissions || [];

      // Check if permissions is an array (from employee login) or object (legacy)
      let hasStallsPermission = false;
      if (Array.isArray(permissions)) {
        hasStallsPermission = permissions.includes("stalls");
      } else {
        hasStallsPermission = permissions.stalls || false;
      }

      console.log("🔍 Employee permission check:", {
        permissions,
        isArray: Array.isArray(permissions),
        hasStallsPermission,
      });

      if (!hasStallsPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Employee does not have stalls permission.",
        });
      }

      // Get employee's branch ID
      const branchId = req.user?.branchId;

      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "Branch ID not found for employee",
        });
      }

      console.log("Fetching stalls for employee in branch ID:", branchId);

      // Get all stalls in the employee's branch
      const [result] = await connection.execute(
        `SELECT 
          s.*,
          s.stall_id as id,
          sec.section_name,
          f.floor_name,
          f.floor_number,
          b.area,
          b.location as branch_location,
          b.branch_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE b.branch_id = ? AND s.status != 'Inactive' AND s.is_available = 1
        ORDER BY s.created_at DESC`,
        [branchId]
      );

      stalls = result;
    } else if (userType === "system_administrator" || userType === "stall_business_owner") {
      // System admin or business owner: Get all stalls
      console.log("Fetching all stalls for admin/owner");

      const [result] = await connection.execute(
        `SELECT 
          s.*,
          s.stall_id as id,
          sec.section_name,
          f.floor_name,
          f.floor_number,
          b.area,
          b.location as branch_location,
          b.branch_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        ORDER BY s.created_at DESC`
      );

      stalls = result;
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' is not authorized to access stalls.`,
      });
    }

    console.log(
      `✅ Found ${stalls.length} stalls for ${userType} (ID: ${userId})`
    );

    res.json({
      success: true,
      message: "Stalls retrieved successfully",
      data: stalls,
      count: stalls.length,
    });
  } catch (error) {
    console.error("❌ Get all stalls error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stalls",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
