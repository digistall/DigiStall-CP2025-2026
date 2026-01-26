import { createConnection } from '../../../config/database.js'

// Delete branch
export const deleteBranch = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await createConnection();
    
    // Check if branch exists
    const [existingBranch] = await connection.execute(
      'SELECT branch_id, branch_name FROM branch WHERE branch_id = ?',
      [id]
    );
    
    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    // Note: deleteBranch is now a HARD DELETE (permanently removes from database)
    // It will also delete all related records: managers, floors, sections, stalls
    
    // Delete the branch using stored procedure (hard delete)
    const [results] = await connection.execute('CALL deleteBranch(?)', [id]);
    
    // Check if stored procedure returned an error
    const firstResult = results[0]?.[0];
    if (firstResult?.error_message) {
      return res.status(400).json({
        success: false,
        message: firstResult.error_message
      });
    }
    
    // Check affected rows (branch was deleted)
    const affected_rows = firstResult?.affected_rows || 0;
    if (affected_rows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete branch - no rows affected'
      });
    }
    
    console.log('✅ Branch permanently deleted:', existingBranch[0].branch_name);
    
    res.json({
      success: true,
      message: 'Branch deleted successfully',
      data: { id: id, branchName: existingBranch[0].branch_name }
    });
    
  } catch (error) {
    console.error('❌ Delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};