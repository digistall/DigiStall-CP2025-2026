import { createConnection } from "../../../../../SHARED/config/database.js";

// Get stalls by location - Uses stored procedure
export const getStallsByLocation = async (req, res) => {
  let connection;
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location parameter is required",
      });
    }

    connection = await createConnection();

    // Use stored procedure instead of direct SQL
    const [rows] = await connection.execute('CALL sp_getStallsByLocation(?)', [location]);
    const stalls = rows[0]; // First result set from stored procedure

    res.json({
      success: true,
      message: `Stalls at ${location} retrieved successfully`,
      data: stalls,
      location: location,
    });
  } catch (error) {
    console.error("❌ Get stalls by location error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stalls by location",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
