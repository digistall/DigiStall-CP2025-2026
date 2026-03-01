import { createConnection } from "../../../config/database.js";

// Get stall by ID - Uses stored procedure
export const getStallById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await createConnection();

    // Use stored procedure instead of direct SQL
    const [rows] = await connection.execute('CALL sp_getStallByIdForLanding(?)', [id]);
    const stalls = rows[0]; // First result set from stored procedure

    if (stalls.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stall not found or not available",
      });
    }

    res.json({
      success: true,
      message: "Stall retrieved successfully",
      data: stalls[0],
    });
  } catch (error) {
    console.error("❌ Get stall by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
