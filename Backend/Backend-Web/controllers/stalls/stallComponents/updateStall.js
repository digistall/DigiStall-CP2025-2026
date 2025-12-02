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

    // Call stored procedure - it handles ALL validation and authorization
    await connection.execute(
      `CALL sp_updateStall_complete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @success, @message)`,
      [
        id,
        updateData.stall_no || updateData.stallNo,
        updateData.stall_location || updateData.location,
        updateData.size,
        updateData.floor_id || updateData.floorId,
        updateData.section_id || updateData.sectionId,
        updateData.rental_price || updateData.price,
        updateData.price_type || updateData.priceType || "Fixed Price",
        updateData.status || "Active",
        updateData.description,
        updateData.stall_image || updateData.image,
        updateData.is_available !== undefined ? updateData.is_available : 1,
        updateData.raffle_auction_deadline || updateData.deadline ? new Date(updateData.raffle_auction_deadline || updateData.deadline) : null,
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

    res.json({
      success: true,
      message: message
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
