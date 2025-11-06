import { createConnection } from '../../../config/database.js'

// Get all branches
export const getAllBranches = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // CALL returns [resultSet, metadata], so we need to get the first element
    const [results] = await connection.execute('CALL getAllBranchesDetailed()');
    const branches = results[0]; // Extract the actual data from the result set
    
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