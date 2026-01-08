import { createConnection } from '../../config/database.js';

/**
 * Submit a complaint from stallholder
 * @route POST /api/mobile/stallholder/complaint
 * @access Protected (Stallholder only)
 */
export const submitComplaint = async (req, res) => {
  let connection;
  
  try {
    const userData = req.user; // From auth middleware
    const stallholderId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.id;
    
    const {
      complaint_type,
      subject,
      description,
      branch_id,
      stall_id,
      evidence // base64 blob
    } = req.body;
    
    console.log('📝 Stallholder submitting complaint:', {
      stallholderId,
      complaint_type,
      subject,
      branch_id
    });
    
    // Validation
    if (!complaint_type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: complaint_type, subject, and description are required'
      });
    }
    
    connection = await createConnection();
    
    // Ensure complaint table exists using stored procedure
    await connection.execute('CALL sp_ensureComplaintTableExists()');
    
    // Get stallholder details for sender info using stored procedure
    let stallholder = null;
    
    // Try to get from stallholder table first
    const [stallholderResult] = await connection.execute(
      'CALL sp_getStallholderDetailsForComplaint(?)',
      [stallholderId]
    );
    
    if (stallholderResult[0] && stallholderResult[0].length > 0) {
      stallholder = stallholderResult[0][0];
    } else {
      // Fallback to applicant table using stored procedure
      const [applicantResult] = await connection.execute(
        'CALL sp_getApplicantDetailsForComplaint(?)',
        [stallholderId]
      );
      if (applicantResult[0] && applicantResult[0].length > 0) {
        stallholder = applicantResult[0][0];
      }
    }
    
    if (!stallholder) {
      return res.status(404).json({
        success: false,
        message: 'Stallholder not found'
      });
    }
    
    // Use branch_id and stall_id from stallholder if not provided
    const finalBranchId = branch_id || stallholder.branch_id || null;
    const finalStallId = stall_id || stallholder.stall_id || null;
    
    // Insert complaint using stored procedure
    const [insertResult] = await connection.execute(
      'CALL sp_insertComplaint(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        complaint_type,
        stallholder.sender_name,
        stallholder.sender_contact,
        stallholder.sender_email,
        stallholderId,
        finalStallId,
        finalBranchId,
        subject,
        description,
        evidence || null
      ]
    );
    
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
    console.error('❌ Error submitting complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit complaint',
      error: error.message
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
    const stallholderId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.id;
    
    console.log('📋 Getting complaints for stallholder:', stallholderId);
    
    connection = await createConnection();
    
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
