import { createConnection } from '../../../config/database.js';
import { logStaffActivity } from '../../OWNER/activityLog/staffActivityLogController.js';

/**
 * Convert evidence BLOB Buffer to base64 string for consumption
 */
const convertEvidenceToBase64 = (record) => {
  if (record && record.evidence) {
    if (Buffer.isBuffer(record.evidence)) {
      record.evidence = record.evidence.toString('base64');
    } else if (record.evidence.type === 'Buffer' && Array.isArray(record.evidence.data)) {
      record.evidence = Buffer.from(record.evidence.data).toString('base64');
    }
  }
  return record;
};


/**
 * Submit a complaint from stallholder
 * @route POST /api/mobile/stallholder/complaint
 * @access Protected (Stallholder only)
 */
export const submitComplaint = async (req, res) => {
  let connection;
  
  try {
    
    const userData = req.user; // From auth middleware
    const userId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    
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
      }
    } catch (lookupErr) {
    }
    

    
    // Ensure complaint table exists using stored procedure
    await connection.execute('CALL sp_ensureComplaintTableExists()');
    console.log('✅ Complaint table ready');
    
    // Use provided branch_id and stall_id or null (procedure will fetch from stallholder table)
    const finalBranchId = branch_id || null;
    const finalStallId = stall_id || null;
    

    
    // Clean base64 prefix if present (e.g. data:image/jpeg;base64,...)
    let cleanEvidence = evidence || null;
    if (cleanEvidence && cleanEvidence.includes(';base64,')) {
      cleanEvidence = cleanEvidence.split(';base64,')[1];
    }
    
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
        cleanEvidence
      ]
    );
    
    console.log('✅ Procedure executed, result:', JSON.stringify(insertResult, null, 2));
    
    const result = insertResult[0]?.[0] || {};
    
    console.log('✅ Complaint submitted successfully, ID:', result.complaint_id);
    
    // Log submit complaint activity
    try {
      const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress;
      await logStaffActivity({
        staffType: 'stallholder',
        staffId: stallholderId,
        staffName: userData.fullName || userData.full_name || userData.username || 'Stallholder',
        branchId: finalBranchId || null,
        actionType: 'CREATE',
        actionDescription: `Submitted complaint: "${subject}" (Type: ${complaint_type}, ID: ${result.complaint_id})`,
        module: 'Complaints',
        ipAddress,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        status: 'success'
      });
    } catch (logErr) {
      console.error('❌ Error logging complaint submission activity:', logErr);
    }
    
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
    }
    
    
    // Get complaints using decrypted stored procedure for proper display
    const [complaintsResult] = await connection.execute(
      'CALL sp_getComplaintsByStallholderDecrypted(?)',
      [stallholderId]
    );
    const rawComplaints = complaintsResult[0] || [];
    
    // Convert evidence blob to base64
    const complaints = rawComplaints.map(c => convertEvidenceToBase64(c));
    
    console.log(`✅ Found ${complaints.length} complaints`);
    
    // Log view complaint status activity
    try {
      const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress;
      await logStaffActivity({
        staffType: 'stallholder',
        staffId: stallholderId,
        staffName: userData.fullName || userData.full_name || userData.username || 'Stallholder',
        branchId: null,
        actionType: 'VIEW',
        actionDescription: `Viewed complaint status (${complaints.length} complaint(s))`,
        module: 'Complaints',
        ipAddress,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        status: 'success'
      });
    } catch (logErr) {
      console.error('❌ Error logging view complaint status activity:', logErr);
    }
    
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

