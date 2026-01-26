import { createConnection } from '../../CONFIG/database.js';

/**
 * Get stallholder profile with stall information
 * @route GET /api/mobile/stallholder/profile/:stallholder_id
 * @access Protected (Stallholder only)
 */
export const getStallholderProfile = async (req, res) => {
  let connection;
  
  try {
    const stallholderId = req.params.stallholder_id || req.user?.stallholderId || req.user?.stallholder_id;
    
    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'Stallholder ID is required'
      });
    }
    
    console.log('📋 Getting stallholder profile for ID:', stallholderId);
    
    connection = await createConnection();
    
    // Use the same stored procedure as complaint submission to get stall info
    const [result] = await connection.execute(
      'CALL sp_getStallholderDetailsForComplaintDecrypted(?)',
      [stallholderId]
    );
    
    const stallholderData = result[0]?.[0];
    
    if (!stallholderData) {
      return res.status(404).json({
        success: false,
        message: 'Stallholder not found'
      });
    }
    
    console.log('✅ Stallholder profile retrieved:', {
      name: stallholderData.sender_name,
      stall_id: stallholderData.stall_id,
      branch_id: stallholderData.branch_id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Stallholder profile retrieved successfully',
      data: {
        stallholder_id: stallholderData.stallholder_id,
        name: stallholderData.sender_name,
        contact: stallholderData.sender_contact,
        email: stallholderData.sender_email,
        branch_id: stallholderData.branch_id,
        stall_id: stallholderData.stall_id,
        stall_number: stallholderData.stall_number, // If available from SP
        source: stallholderData.source
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching stallholder profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stallholder profile',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export default {
  getStallholderProfile
};

