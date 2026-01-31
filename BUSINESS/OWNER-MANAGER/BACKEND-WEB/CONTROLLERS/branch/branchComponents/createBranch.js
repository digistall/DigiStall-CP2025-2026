import { createConnection } from '../../../CONFIG/database.js'

// Create new branch
export const createBranch = async (req, res) => {
  let connection;
  try {
    const {
      branch_name,
      area,
      location,
      address,
      contact_number,
      email,
      status = 'Active'
    } = req.body;
    
    // Get the current user from auth middleware
    const currentUser = req.user;
    const userRole = currentUser?.role || currentUser?.staff_type;
    
    // Validation
    if (!branch_name || !area || !location) {
      return res.status(400).json({
        success: false,
        message: 'Branch name, area, and location are required'
      });
    }
    
    connection = await createConnection();
    
    // Check if branch already exists
    const [existingBranch] = await connection.execute(
      'SELECT branch_id FROM branch WHERE branch_name = ? OR (area = ? AND location = ?)',
      [branch_name, area, location]
    );
    
    if (existingBranch.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Branch with this name or location already exists'
      });
    }
    
    // Handle based on user role
    let insertResult;
    
    if (userRole === 'business_owner' || userRole === 'stall_business_owner') {
      // Business owner creating their own branch
      const businessOwnerId = currentUser.id || currentUser.business_owner_id || currentUser.userId;
      
      console.log('📌 Business Owner creating branch:', { businessOwnerId, branch_name, userRole });
      
      // Use createBranchForOwner stored procedure
      const [results] = await connection.execute(
        'CALL createBranchForOwner(?, ?, ?, ?, ?, ?, ?, ?)',
        [businessOwnerId, branch_name, area, location, address || '', contact_number || '', email || '', status]
      );
      
      insertResult = results[0];
    } else {
      // Admin creating branch (original logic)
      // Get admin_id (assuming there's only one admin for now)
      const [adminResult] = await connection.execute(
        `SELECT admin_id FROM admin WHERE status = 'Active' LIMIT 1`
      );
      
      if (adminResult.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active admin found'
        });
      }
      
      const admin_id = adminResult[0].admin_id;
      
      // Insert new branch using stored procedure
      const [results] = await connection.execute(
        'CALL createBranch(?, ?, ?, ?, ?, ?, ?, ?)',
        [admin_id, branch_name, area, location, address, contact_number, email, status]
      );
      
      insertResult = results[0];
    }
    
    const createdBranch = insertResult[0];
    const branchId = createdBranch.branch_id;
    
    // Get complete branch data using the same stored procedure as getAllBranches
    const [allBranchesResults] = await connection.execute('CALL getAllBranchesDetailed()');
    const allBranches = allBranchesResults[0];
    
    // Find the newly created branch in the results
    const completeBranchData = allBranches.find(branch => branch.branch_id === branchId);
    
    if (!completeBranchData) {
      throw new Error('Failed to retrieve created branch data');
    }
    
    console.log('✅ Branch created successfully:', branch_name);
    
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: completeBranchData
    });
    
  } catch (error) {
    console.error('❌ Create branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

