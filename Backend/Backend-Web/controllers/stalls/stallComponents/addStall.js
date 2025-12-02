import { createConnection } from '../../../config/database.js'

// Add new stall using stored procedure
export const addStall = async (req, res) => {
  let connection;
  try {
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Map frontend field names to backend field names
    const {
      stallNumber,
      stallNo,
      price,
      rental_price,
      floor_id,
      floor,
      floorId,  // Added: Frontend sends 'floorId'
      section_id,
      section,
      sectionId,  // Added: Frontend sends 'sectionId'
      size,
      location,
      stall_location,
      description,
      image,
      stall_image,
      isAvailable = true,
      status,
      priceType = "Fixed Price",
      price_type,
      // UPDATED: Raffle/Auction deadline fields (replaced duration)
      deadline,  // New: deadline as datetime string
      applicationDeadline, // Alternative field name
      startingPrice // Only for auctions
    } = req.body;

    // Use the mapped values with multiple fallbacks
    const stallNo_final = stallNo || stallNumber;
    const price_final = rental_price || price;
    const location_final = stall_location || location;
    const image_final = stall_image || image;
    const priceType_final = price_type || priceType || "Fixed Price";
    const floor_id_final = floor_id || floor || floorId;
    const section_id_final = section_id || section || sectionId;
    const deadline_final = deadline || applicationDeadline;
    const finalPrice = priceType_final === "Auction" && startingPrice 
      ? parseFloat(startingPrice) 
      : parseFloat(price_final);
    const parsedDeadline = deadline_final ? new Date(deadline_final) : null;

    connection = await createConnection();

    // Call stored procedure - it handles ALL validation and business logic
    const [result] = await connection.execute(
      `CALL sp_addStall_complete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @stall_id, @success, @message)`,
      [
        stallNo_final,
        location_final,
        size,
        floor_id_final,
        section_id_final,
        finalPrice,
        priceType_final,
        isAvailable !== false ? "Active" : "Inactive",
        "APPROVED",
        description || null,
        image_final || null,
        isAvailable !== false ? 1 : 0,
        parsedDeadline,
        userId,
        userType,
        branchId
      ]
    );

    // Get output parameters
    const [outParams] = await connection.execute(
      `SELECT @stall_id as stall_id, @success as success, @message as message`
    );

    const { stall_id: stallId, success, message } = outParams[0];

    if (!success) {
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(201).json({
      success: true,
      message: message,
      data: { id: stallId }
    });

  } catch (error) {
    console.error("❌ Add stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};