import { createConnection } from "../../../config/database.js";

// Update stall (for branch managers and employees with stalls permission)
export const updateStall = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log("🔄 UPDATE STALL DEBUG:");
    console.log("- Stall ID:", id);
    console.log("- User Type:", userType);
    console.log("- User ID:", userId);
    console.log("- Update data:", updateData);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Authorization check based on user type
    if (userType === "business_manager") {
      // Business manager authorization (existing logic)
      console.log("🔍 Authorizing business manager for stall update");
    } else if (userType === "business_employee") {
      // Employee authorization - check permissions
      const permissions = req.user?.permissions || [];
      const hasStallsPermission = Array.isArray(permissions)
        ? permissions.includes("stalls")
        : permissions.stalls || false;

      console.log("🔍 Employee permission check for stall update:", {
        permissions,
        hasStallsPermission,
      });

      if (!hasStallsPermission) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Employee does not have stalls permission for updating.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot update stalls.`,
      });
    }

    connection = await createConnection();

    // Check if stall exists and user has permission to update it
    let stallQuery, stallParams;

    if (userType === "business_manager") {
      // Business manager: Check if stall belongs to their branch
      const businessManagerId = req.user?.businessManagerId || userId;
      stallQuery = `SELECT s.* 
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
      stallQuery = `SELECT s.* 
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
        message: "Stall not found or you do not have permission to update it",
      });
    }

    // Build dynamic update query - extract all values
    const stallNo = updateData.stallNo || updateData.stallNumber || existingStall[0].stall_no;
    const stallLocation = updateData.stall_location || updateData.location || existingStall[0].stall_location;
    const size = updateData.size || existingStall[0].size;
    const rentalPrice = updateData.rental_price || updateData.price || existingStall[0].rental_price;
    const priceType = updateData.price_type || updateData.priceType || existingStall[0].price_type;
    const status = updateData.status || existingStall[0].status;
    const description = updateData.description !== undefined ? updateData.description : existingStall[0].description;
    const stallImage = updateData.stall_image || updateData.image || existingStall[0].stall_image;
    const isAvailable = updateData.is_available !== undefined ? updateData.is_available : 
                        updateData.isAvailable !== undefined ? updateData.isAvailable : 
                        existingStall[0].is_available;
    const floorId = updateData.floor_id || updateData.floorId || existingStall[0].floor_id;
    const sectionId = updateData.section_id || updateData.sectionId || existingStall[0].section_id;
    const raffleAuctionDeadline = updateData.raffle_auction_deadline || updateData.deadline || existingStall[0].raffle_auction_deadline;

    // Use stored procedure to update stall
    await connection.execute(
      `CALL sp_updateStall(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @success, @message)`,
      [
        id,                          // stall_id
        stallNo,                     // stall_no
        stallLocation,               // stall_location
        size,                        // size
        floorId,                     // floor_id
        sectionId,                   // section_id
        parseFloat(rentalPrice),     // rental_price
        priceType,                   // price_type
        status,                      // status
        description,                 // description
        stallImage,                  // stall_image
        isAvailable ? 1 : 0,         // is_available
        raffleAuctionDeadline,       // raffle_auction_deadline
        userId,                      // updated_by_business_manager
      ]
    );

    // Get the output parameters
    const [outParams] = await connection.execute(
      `SELECT @success as success, @message as message`
    );

    const { success, message } = outParams[0];

    if (!success) {
      return res.status(400).json({
        success: false,
        message: message || 'Failed to update stall'
      });
    }

    // Get updated stall data with explicit field selection to avoid ID confusion
    const [updatedStall] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_id as id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.rental_price,
        s.price_type,
        s.status,
        s.description,
        s.stall_image,
        s.is_available,
        s.created_at,
        s.updated_at,
        s.stamp,
        sec.section_id,
        sec.section_name,
        f.floor_id,
        f.floor_name,
        f.floor_number,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location as branch_location
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [id]
    );

    console.log(
      `✅ Stall updated successfully by ${userType}:`,
      existingStall[0].stall_no
    );

    res.json({
      success: true,
      message: "Stall updated successfully",
      data: updatedStall[0],
    });
  } catch (error) {
    console.error("❌ Update stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
