import { createConnection } from "../../../config/database.js";

// Delete stall (for branch managers and employees with stalls permission)
export const deleteStall = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log("🗑️ DELETE STALL DEBUG:");
    console.log("- Stall ID:", id);
    console.log("- User Type:", userType);
    console.log("- User ID:", userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Authorization check based on user type
    if (userType === "business_manager") {
      // Business manager authorization (existing logic)
      console.log("🔍 Authorizing business manager for stall deletion");
    } else if (userType === "business_employee") {
      // Employee authorization - check permissions
      const permissions = req.user?.permissions || [];
      const hasStallsPermission = Array.isArray(permissions)
        ? permissions.includes("stalls")
        : permissions.stalls || false;

      console.log("🔍 Employee permission check for stall deletion:", {
        permissions,
        hasStallsPermission,
      });

      if (!hasStallsPermission) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Employee does not have stalls permission for deleting.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot delete stalls.`,
      });
    }

    connection = await createConnection();

    // Check if stall exists and user has permission to delete it
    let stallQuery, stallParams;

    if (userType === "business_manager") {
      // Business manager: Check if stall belongs to their branch
      const businessManagerId = req.user?.businessManagerId || userId;
      stallQuery = `SELECT s.stall_id, s.stall_no 
                   FROM stall s
                   INNER JOIN section sec ON s.section_id = sec.section_id
                   INNER JOIN floor f ON sec.floor_id = f.floor_id
                   INNER JOIN branch b ON f.branch_id = b.branch_id
                   INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
                   WHERE s.stall_id = ? AND bm.business_manager_id = ?`;
      stallParams = [id, businessManagerId];
    } else if (userType === "business_employee") {
      // Employee: Check if stall belongs to their branch
      const branchId = req.user?.branchId;
      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "Branch ID not found for employee",
        });
      }
      stallQuery = `SELECT s.stall_id, s.stall_no 
                   FROM stall s
                   INNER JOIN section sec ON s.section_id = sec.section_id
                   INNER JOIN floor f ON sec.floor_id = f.floor_id
                   INNER JOIN branch b ON f.branch_id = b.branch_id
                   WHERE s.stall_id = ? AND b.branch_id = ?`;
      stallParams = [id, branchId];
    }

    const [existingStall] = await connection.execute(stallQuery, stallParams);

    if (existingStall.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stall not found or you do not have permission to delete it",
      });
    }

    // Use stored procedure to delete stall
    await connection.execute(
      `CALL sp_deleteStall(?, ?, @success, @message)`,
      [id, userId]
    );

    // Get the output parameters
    const [outParams] = await connection.execute(
      `SELECT @success as success, @message as message`
    );

    const { success, message } = outParams[0];

    if (!success) {
      return res.status(400).json({
        success: false,
        message: message || 'Failed to delete stall'
      });
    }

    console.log(
      `✅ Stall deleted successfully by ${userType}:`,
      existingStall[0].stall_no
    );

    res.json({
      success: true,
      message: message,
      data: {
        id: id,
        stallNumber: existingStall[0].stall_no,
      },
    });
  } catch (error) {
    console.error("❌ Delete stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
