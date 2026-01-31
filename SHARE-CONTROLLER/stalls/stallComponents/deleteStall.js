import { createConnection } from '../../../CONFIG/database.js'
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

    console.log(`??? Delete stall request - ID: ${id}, UserType: ${userType}, UserId: ${userId}, BranchId: ${branchId}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in authentication token'
      });
    }

    connection = await createConnection();

    // Get stall info (branch_id and stall_number) before deleting
    const [stallInfo] = await connection.execute(
      `SELECT s.stall_id, s.stall_number, s.section_id, f.branch_id, f.floor_id
       FROM stall s
       INNER JOIN section sec ON s.section_id = sec.section_id
       INNER JOIN floor f ON sec.floor_id = f.floor_id
       WHERE s.stall_id = ?`,
      [id]
    );

    console.log(`?? Stall info query result:`, stallInfo);

    // Check if stall exists
    if (stallInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const { stall_number, branch_id } = stallInfo[0];

    // Authorization check
    if (userType === 'business_manager') {
      const [managerCheck] = await connection.execute(
        `SELECT 1 FROM business_manager WHERE business_manager_id = ? AND branch_id = ?`,
        [userId, branch_id]
      );
      if (managerCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Stall does not belong to your branch'
        });
      }
    } else if (userType === 'business_employee') {
      if (branchId !== branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Stall does not belong to your branch'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot delete stalls`
      });
    }

    // Check for dependencies
    const [applications] = await connection.execute(
      `SELECT COUNT(*) as count FROM application WHERE stall_id = ?`,
      [id]
    );
    if (applications[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stall ${stall_number}. Application records exist. Archive stall instead.`
      });
    }

    const [stallholders] = await connection.execute(
      `SELECT COUNT(*) as count FROM stallholder WHERE stall_id = ?`,
      [id]
    );
    if (stallholders[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stall ${stall_number}. Stallholder records exist. Archive stall instead.`
      });
    }

    // Start transaction for delete
    await connection.beginTransaction();

    try {
      // Delete stall images first (foreign key constraint)
      await connection.execute(`DELETE FROM stall_images WHERE stall_id = ?`, [id]);
      console.log(`??? Deleted stall images for stall ${id}`);

      // Delete the stall
      const [deleteResult] = await connection.execute(`DELETE FROM stall WHERE stall_id = ?`, [id]);
      console.log(`??? Delete result:`, deleteResult);

      if (deleteResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Failed to delete stall - no rows affected'
        });
      }

      // Commit the transaction
      await connection.commit();
      console.log(`? Transaction committed - Stall ${stall_number} deleted from database`);

      // Delete stall folder from file system
      const stallFolder = path.join('C:', 'xampp', 'htdocs', 'digistall_uploads', 'stalls', String(branch_id), stall_number);
      
      if (fs.existsSync(stallFolder)) {
        try {
          fs.rmSync(stallFolder, { recursive: true, force: true });
          console.log(`? Deleted stall folder: ${stallFolder}`);
        } catch (fsError) {
          console.error(`?? Failed to delete stall folder: ${stallFolder}`, fsError.message);
        }
      }

      res.json({
        success: true,
        message: `Stall ${stall_number} deleted successfully`
      });

    } catch (deleteError) {
      await connection.rollback();
      console.error('? Delete transaction error:', deleteError);
      throw deleteError;
    }

  } catch (error) {
    console.error('? Delete stall error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stall',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

