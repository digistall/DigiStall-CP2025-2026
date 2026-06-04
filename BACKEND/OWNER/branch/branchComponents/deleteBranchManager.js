import { createConnection } from '../../../../config/database.js';

// Delete branch manager
export const deleteBranchManager = async (req, res) => {
  let connection;
  try {

    const { managerId } = req.params; // Get manager ID from URL params

    console.log('- managerId:', managerId, '(valid:', !!managerId, ')');

    // Validation
    if (!managerId) {
      console.log('❌ Missing manager ID in URL params');
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    connection = await createConnection();
    console.log('✅ Database connection established');

    // Get manager data before deletion for response
    const [managerData] = await connection.execute(
      `SELECT 
        bm.branch_manager_id,
        bm.first_name,
        bm.last_name,
        bm.manager_username,
        bm.email,
        bm.contact_number,
        bm.status,
        bm.created_at,
        bm.updated_at,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
      FROM branch_manager bm
      LEFT JOIN branch b ON bm.branch_id = b.branch_id
      WHERE bm.branch_manager_id = ?`,
      [managerId]
    );

    if (managerData.length === 0) {
      console.log('❌ Manager not found:', managerId);
      return res.status(404).json({
        success: false,
        message: 'Branch manager not found'
      });
    }

    const manager = managerData[0];
    console.log('✅ Manager found:', {
      id: manager.branch_manager_id,
      name: `${manager.first_name} ${manager.last_name}`,
      username: manager.manager_username,
      branch: manager.branch_name
    });

    // Check if this is the only manager for the branch
    if (manager.branch_id) {
      const [managerCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM branch_manager WHERE branch_id = ?',
        [manager.branch_id]
      );


      // Optional: You can uncomment this block if you want to prevent deletion of the last manager
      /*
      if (managerCount[0].count === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only manager assigned to this branch. Please assign another manager first.'
        });
      }
      */
    }

    // Perform the deletion
    const [deleteResult] = await connection.execute(
      'DELETE FROM branch_manager WHERE branch_manager_id = ?',
      [managerId]
    );

    console.log('✅ Manager deleted successfully, affected rows:', deleteResult.affectedRows);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch manager not found'
      });
    }

    res.json({
      success: true,
      message: 'Branch manager deleted successfully',
      data: {
        deletedManager: {
          managerId: manager.branch_manager_id,
          managerName: `${manager.first_name} ${manager.last_name}`,
          username: manager.manager_username,
          email: manager.email,
          contactNumber: manager.contact_number,
          status: manager.status,
          branchId: manager.branch_id,
          branchName: manager.branch_name,
          area: manager.area,
          location: manager.location,
          createdAt: manager.created_at,
          updatedAt: manager.updated_at
        },
        action: 'deleted'
      }
    });

  } catch (error) {
    console.error('❌ Delete branch manager error:', error);
    console.error('Error stack:', error.stack);

    // Handle specific database errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch manager. There are related records that reference this manager.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete branch manager',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
};

