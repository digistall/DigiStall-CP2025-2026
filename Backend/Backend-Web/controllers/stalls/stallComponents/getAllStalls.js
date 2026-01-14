import { createConnection } from '../../../config/database.js'
import { decryptData } from '../../../services/encryptionService.js'

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

    // Call decrypted stored procedure - it handles ALL authorization
    const [result] = await connection.execute(
      `CALL sp_getAllStalls_complete_decrypted(?, ?, ?)`,
      [userId, userType, branchId]
    );

    const stalls = result[0] || [];

    // Backend-level decryption for stallholder names (in case stored procedure decryption fails)
    const decryptedStalls = stalls.map(stall => {
      if (stall.stallholder_name && typeof stall.stallholder_name === 'string' && stall.stallholder_name.includes(':')) {
        try {
          stall.stallholder_name = decryptData(stall.stallholder_name);
        } catch (error) {
          console.error(`Failed to decrypt stallholder name for stall ${stall.stall_id}:`, error.message);
        }
      }
      return stall;
    });

    // Debug: Log first few stalls to check decryption
    console.log('🔍 DEBUG: Sample stalls after decryption:');
    decryptedStalls.slice(0, 3).forEach(s => {
      console.log({
        stall_no: s.stall_no,
        stallholder_id: s.stallholder_id,
        stallholder_name: s.stallholder_name,
        availability_status: s.availability_status
      });
    });

    res.json({
      success: true,
      message: "Stalls retrieved successfully",
      data: decryptedStalls,
      count: decryptedStalls.length,
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
