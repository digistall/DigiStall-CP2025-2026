// ===== MOBILE USER CONTROLLER =====
// Simple user management for mobile applications

import { createConnection } from '../../config/database.js';

// Get user profile
export const getUserProfile = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const userId = req.user.userId; // From authentication middleware
    
    const [[user]] = await connection.execute(
      'CALL getApplicantById(?)',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const userId = req.user.userId; // From authentication middleware
    const { first_name, last_name, phone_number, email, address } = req.body;
    
    // Get existing user data
    const [[existingUser]] = await connection.execute('CALL getApplicantById(?)', [userId]);
    
    // Update user profile using stored procedure
    await connection.execute(
      'CALL updateApplicant(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        first_name || existingUser.first_name,
        last_name || existingUser.last_name,
        email || existingUser.email,
        phone_number || existingUser.contact_number,
        address || existingUser.address,
        existingUser.business_type,
        existingUser.business_name,
        existingUser.business_description,
        existingUser.preferred_area,
        existingUser.preferred_location,
        existingUser.application_status
      ]
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};