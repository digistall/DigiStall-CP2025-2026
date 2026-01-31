import { createConnection } from '../../../CONFIG/database.js'
import { decryptData } from '../../../SERVICES/encryptionService.js'

// Get all branches
export const getAllBranches = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // CALL returns [resultSet, metadata], so we need to get the first element
    const [results] = await connection.execute('CALL getAllBranchesDetailed()');
    const branches = results[0]; // Extract the actual data from the result set
    
    // Decrypt manager names if they exist
    const decryptedBranches = branches.map(branch => {
      if (branch.manager_first_name && branch.manager_last_name) {
        try {
          const decryptedFirst = decryptData(branch.manager_first_name);
          const decryptedLast = decryptData(branch.manager_last_name);
          const manager_name = `${decryptedFirst} ${decryptedLast}`;
          
          // Remove the separate encrypted fields and add decrypted full name
          const { manager_first_name, manager_last_name, ...rest } = branch;
          return { ...rest, manager_name };
        } catch (error) {
          console.error('Error decrypting manager name for branch:', branch.branch_id, error.message);
          const { manager_first_name, manager_last_name, ...rest } = branch;
          return { ...rest, manager_name: null };
        }
      }
      return branch;
    });
    
    res.json({
      success: true,
      data: decryptedBranches,
      message: 'Branches retrieved successfully',
      count: decryptedBranches.length
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

