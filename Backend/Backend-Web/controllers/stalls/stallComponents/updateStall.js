import { createConnection } from '../../../config/database.js'

// Update stall using stored procedure
export const updateStall = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    connection = await createConnection();

    // Prepare parameters with proper null handling
    const stallNo = updateData.stall_no || updateData.stallNo || null;
    const stallLocation = updateData.stall_location || updateData.location || null;
    const size = updateData.size || null;
    const floorId = updateData.floor_id || updateData.floorId || null;
    const sectionId = updateData.section_id || updateData.sectionId || null;
    const rentalPrice = updateData.rental_price || updateData.price || null;
    const priceType = updateData.price_type || updateData.priceType || "Fixed Price";
    const status = updateData.status || "Active";
    const description = updateData.description || null;
    const stallImage = updateData.stall_image || updateData.image || null;
    const isAvailable = updateData.is_available !== undefined ? updateData.is_available : 1;
    const deadline = updateData.raffle_auction_deadline || updateData.deadline;
    const parsedDeadline = deadline ? new Date(deadline) : null;

    // Call stored procedure - it handles ALL validation and authorization
    await connection.execute(
      `CALL sp_updateStall_complete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @success, @message)`,
      [
        id,
        stallNo,
        stallLocation,
        size,
        floorId,
        sectionId,
        rentalPrice,
        priceType,
        status,
        description,
        stallImage,
        isAvailable,
        parsedDeadline,
        userId,
        userType,
        branchId
      ]
    );

    // Get output parameters
    const [outParams] = await connection.execute(
      `SELECT @success as success, @message as message`
    );

    const { success, message } = outParams[0];

    if (!success) {
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    // Fetch the updated stall data to return - match sp_getAllStalls_complete format
    const [updatedStall] = await connection.execute(
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
      WHERE s.stall_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: message,
      data: updatedStall[0]
    });

  } catch (error) {
    console.error(" Update stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
