import { createConnection } from '../../../config/database.js'

// Delete stall using stored procedure
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

    res.json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error(' Delete stall error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stall',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};
