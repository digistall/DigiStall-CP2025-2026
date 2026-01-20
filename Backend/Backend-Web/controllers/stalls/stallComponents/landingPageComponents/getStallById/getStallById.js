import { createConnection } from "../../../../../config/database.js";

// Get stall by ID
export const getStallById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
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
      WHERE s.stall_id = ? AND s.status = 'Available' AND s.is_available = 1
    `,
      [id]
    );

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
