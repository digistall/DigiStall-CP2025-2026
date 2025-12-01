import { createConnection } from "../../../config/database.js";
import { getBranchFilter } from "../../../middleware/rolePermissions.js";

// Get all stalls for the authenticated user using stored procedure
export const getAllStalls = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    console.log("🔍 getAllStalls - User details:", {
      userType,
      userId,
      branchId: branchId,
      permissions: req.user?.permissions,
    });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    let stalls = [];

    // Handle different user types
    if (userType === "business_manager") {
      // Use stored procedure for business manager
      const businessManagerId = req.user?.businessManagerId || userId;
      console.log("🔍 getAllStalls - Fetching stalls for business manager:", businessManagerId);
      
      const [result] = await connection.execute(
        `CALL sp_getAllStallsByManager(?)`,
        [businessManagerId]
      );
      
      stalls = result[0] || [];
    } else if (userType === "business_employee") {
      // Employee: Check permissions first
      const permissions = req.user?.permissions || [];

      let hasStallsPermission = false;
      if (Array.isArray(permissions)) {
        hasStallsPermission = permissions.includes("stalls");
      } else {
        hasStallsPermission = permissions.stalls || false;
      }

      console.log("🔍 Employee permission check:", {
        permissions,
        hasStallsPermission,
      });

      if (!hasStallsPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Employee does not have stalls permission.",
        });
      }

      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "Branch ID not found for employee",
        });
      }

      console.log("🔍 getAllStalls - Fetching stalls for branch:", branchId);

      // Use stored procedure for branch
      const [result] = await connection.execute(
        `CALL sp_getAllStallsByBranch(?)`,
        [branchId]
      );

      stalls = result[0] || [];
    } else if (userType === "system_administrator") {
      // System admin: Get all stalls (we'll need to modify this or add a new stored procedure)
      console.log("🔍 getAllStalls - System admin viewing all stalls");
      
      const [result] = await connection.execute(
        `SELECT 
          s.stall_id,
          s.stall_no,
          s.stall_location,
          s.size,
          s.floor_id,
          f.floor_name,
          s.section_id,
          sec.section_name,
          s.rental_price,
          s.price_type,
          s.status,
          s.stamp,
          s.description,
          s.stall_image,
          s.is_available,
          s.raffle_auction_deadline,
          s.deadline_active,
          s.raffle_auction_status,
          s.created_by_business_manager,
          s.created_at,
          s.updated_at,
          b.branch_id,
          b.branch_name,
          b.area,
          CASE 
            WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
            WHEN s.is_available = 1 THEN 'Available'
            ELSE 'Unavailable'
          END as availability_status,
          sh.stallholder_id,
          sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
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
