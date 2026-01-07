import { createConnection } from '../../../config/database.js'
import fs from 'fs';
import path from 'path';

// Delete stall using stored procedure and remove stall folder
export const deleteStall = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in authentication token'
      });
    }

    connection = await createConnection();

    // Get stall info (branch_id and stall_no) before deleting
    const [stallInfo] = await connection.execute(
      `SELECT s.stall_no, f.branch_id 
       FROM stall s
       INNER JOIN floor f ON s.floor_id = f.floor_id
       WHERE s.stall_id = ?`,
      [id]
    );

    // Call stored procedure - it handles ALL validation and authorization
    await connection.execute(
      `CALL sp_deleteStall_complete(?, ?, ?, ?, @success, @message)`,
      [id, userId, userType, branchId]
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

    // Delete stall folder from file system
    if (stallInfo.length > 0) {
      const { stall_no, branch_id } = stallInfo[0];
      const stallFolder = path.join('C:', 'xampp', 'htdocs', 'digistall_uploads', 'stalls', String(branch_id), stall_no);
      
      if (fs.existsSync(stallFolder)) {
        try {
          // Remove directory and all its contents recursively
          fs.rmSync(stallFolder, { recursive: true, force: true });
          console.log(`✅ Deleted stall folder: ${stallFolder}`);
        } catch (fsError) {
          console.error(`⚠️ Failed to delete stall folder: ${stallFolder}`, fsError.message);
          // Don't fail the request if folder deletion fails - DB deletion succeeded
        }
      }
    }

    res.json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('❌ Delete stall error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stall',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};
