import { createConnection } from "../../../../../CONFIG/database.js";

// Get stalls by location
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

    const [stalls] = await connection.execute(
      `
      SELECT 
        s.*,
        s.stall_id as id,
        si.image_id as stall_image_id,
        sec.section_name as section,
        f.floor_name as floor,
        b.branch_name as branch
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON s.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
      WHERE b.location = ? AND s.status = 'Available' AND s.is_available = 1
      ORDER BY s.stall_number, s.created_at DESC
    `,
      [location]
    );

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

