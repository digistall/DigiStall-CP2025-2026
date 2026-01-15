import { createConnection } from '../../../config/database.js'

// Get all stalls using stored procedure
export const getAllStalls = async (req, res) => {
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

    connection = await createConnection();

    // Call stored procedure - it handles ALL authorization
    const [result] = await connection.execute(
      `CALL sp_getAllStalls_complete_decrypted(?, ?, ?)`,
      [userId, userType, branchId]
    );

    const stalls = result[0] || [];

    res.json({
      success: true,
      message: "Stalls retrieved successfully",
      data: stalls,
      count: stalls.length,
    });

  } catch (error) {
    console.error(" Get all stalls error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stalls",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
