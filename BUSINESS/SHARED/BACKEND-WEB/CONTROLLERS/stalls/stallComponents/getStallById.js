import { createConnection } from '../../../config/database.js'

// Get stall by ID using stored procedure
export const getStallById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in authentication token',
      });
    }

    connection = await createConnection();

    // Call stored procedure - it handles ALL authorization
    const [result] = await connection.execute(
      `CALL sp_getStallById_complete(?, ?, ?, ?, @success, @message)`,
      [id, userId, userType, branchId]
    );

    // Get output parameters
    const [outParams] = await connection.execute(
      `SELECT @success as success, @message as message`
    );

    const { success, message } = outParams[0];
    const stalls = result[0] || [];

    if (!success || stalls.length === 0) {
      return res.status(404).json({
        success: false,
        message: message || 'Stall not found',
      });
    }

    res.json({
      success: true,
      message: message,
      data: stalls[0]
    });

  } catch (error) {
    console.error(' Get stall by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stall',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

