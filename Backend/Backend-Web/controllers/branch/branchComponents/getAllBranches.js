import { createConnection } from '../../../config/database.js'

// Get all branches
export const getAllBranches = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [branches] = await connection.execute('CALL getAllBranchesDetailed()');
    
    res.json({
      success: true,
      data: branches,
      message: 'Branches retrieved successfully',
      count: branches.length
    });
    
  } catch (error) {
    console.error('❌ Get all branches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};