import { createConnection } from '../../../config/database.js';

/**
 * Submit a complaint from stallholder
 * @route POST /api/mobile/stallholder/complaint
 * @access Protected (Stallholder only)
 */
export const submitComplaint = async (req, res) => {
  let connection;
  
  try {
    console.log('🚀 === COMPLAINT SUBMISSION START ===');
    console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User from token:', JSON.stringify(req.user, null, 2));
    
    const userData = req.user; // From auth middleware
    const userId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    console.log('🆔 Resolved user/applicant ID:', userId);
    
    const {
      complaint_type,
      subject,
      description,
      branch_id,
      stall_id,
      evidence // base64 blob
    } = req.body;
    
    // Validation
    if (!complaint_type || !subject || !description) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: complaint_type, subject, and description are required'
      });
    }
    
    if (!userId) {
      console.log('❌ No user ID found');
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    
    console.log('📡 Creating database connection...');
    connection = await createConnection();
    console.log('✅ Database connected');
    
    // Look up actual stallholder_id from DB using mobile_user_id or applicant_id
    let stallholderId = userId;
    try {
      const [shRows] = await connection.execute(
        `SELECT stallholder_id, stall_id, branch_id FROM stallholder 
         WHERE mobile_user_id = ? OR applicant_id = ? OR stallholder_id = ? LIMIT 1`,
        [userId, userId, userId]
      );
      if (shRows.length > 0) {
        stallholderId = shRows[0].stallholder_id;
        console.log('✅ Resolved actual stallholder_id:', stallholderId, 'from userId:', userId);
      } else {
        console.log('⚠️ No stallholder record found for userId:', userId, '- using userId as fallback');
      }
    } catch (lookupErr) {
      console.log('⚠️ Stallholder lookup error:', lookupErr.message, '- using userId as fallback');
    }
    
    console.log('📝 Stallholder submitting complaint:', {
      stallholderId,
      complaint_type,
      subject,
      branch_id
    });
    
    // Ensure complaint table exists using stored procedure
    console.log('🔧 Ensuring complaint table exists...');
    await connection.execute('CALL sp_ensureComplaintTableExists()');
    console.log('✅ Complaint table ready');
    
    // Use provided branch_id and stall_id or null (procedure will fetch from stallholder table)
    const finalBranchId = branch_id || null;
    const finalStallId = stall_id || null;
    
    console.log('💾 Calling sp_submitComplaint with params:', {
      complaint_type,
      stallholder_id: stallholderId,
      stall_id: finalStallId,
      branch_id: finalBranchId,
      subject,
      description: description.substring(0, 50) + '...',
      evidence: evidence ? 'provided' : 'null'
    });
    
    // Submit complaint using stored procedure (it fetches stallholder details automatically)
    const [insertResult] = await connection.execute(
      'CALL sp_submitComplaint(?, ?, ?, ?, ?, ?, ?)',
      [
        complaint_type,
        stallholderId,
        finalStallId,
        finalBranchId,
        subject,
        description,
        evidence || null
      ]
    );
    
    console.log('✅ Procedure executed, result:', JSON.stringify(insertResult, null, 2));
    
    const result = insertResult[0]?.[0] || {};
    
    console.log('✅ Complaint submitted successfully, ID:', result.complaint_id);
    
    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaint_id: result.complaint_id
      }
    });
    
  } catch (error) {
    console.error('❌ ===  ERROR SUBMITTING COMPLAINT ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('SQL details:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to submit complaint',
      error: error.message,
      details: error.sqlMessage || error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Get stallholder's complaints
 * @route GET /api/mobile/stallholder/complaints
 * @access Protected (Stallholder only)
 */
export const getMyComplaints = async (req, res) => {
  let connection;
  
  try {
    const userData = req.user;
    const userId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    console.log('📋 Getting complaints for user:', userId);
    
    connection = await createConnection();
    
    // Look up actual stallholder_id from DB
    let stallholderId = userId;
    try {
      const [shRows] = await connection.execute(
        `SELECT stallholder_id FROM stallholder 
         WHERE mobile_user_id = ? OR applicant_id = ? OR stallholder_id = ? LIMIT 1`,
        [userId, userId, userId]
      );
      if (shRows.length > 0) {
        stallholderId = shRows[0].stallholder_id;
        console.log('✅ Resolved stallholder_id:', stallholderId, 'from userId:', userId);
      }
    } catch (lookupErr) {
      console.log('⚠️ Stallholder lookup failed:', lookupErr.message);
    }
    
    console.log('📋 Getting complaints for stallholder:', stallholderId);
    
    // Get complaints using decrypted stored procedure for proper display
    const [complaintsResult] = await connection.execute(
      'CALL sp_getComplaintsByStallholderDecrypted(?)',
      [stallholderId]
    );
    const complaints = complaintsResult[0] || [];
    
    console.log(`✅ Found ${complaints.length} complaints`);
    
    return res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: complaints,
      count: complaints.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

