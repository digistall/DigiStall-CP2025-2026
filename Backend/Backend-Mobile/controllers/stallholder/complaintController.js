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
    
    // Get stallholder details for sender info - first try stallholder table, then applicant
    let stallholder = null;
    
    // Try to get from stallholder table first
    const [stallholderRows] = await connection.execute(
      `SELECT 
        stallholder_name as sender_name,
        contact_number as sender_contact,
        email as sender_email,
        branch_id,
        stall_id
       FROM stallholder 
       WHERE stallholder_id = ? OR applicant_id = ?`,
      [stallholderId, stallholderId]
    );
    
    if (stallholderRows.length > 0) {
      stallholder = stallholderRows[0];
    } else {
      // Fallback to applicant table
      const [applicantRows] = await connection.execute(
        `SELECT 
          applicant_full_name as sender_name,
          applicant_contact_number as sender_contact,
          applicant_email as sender_email
         FROM applicant 
         WHERE applicant_id = ?`,
        [stallholderId]
      );
      stallholder = applicantRows[0];
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
    
    // Check if complaint table exists, if not create it
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS complaint (
        complaint_id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_type VARCHAR(100) NOT NULL,
        sender_name VARCHAR(255),
        sender_contact VARCHAR(50),
        sender_email VARCHAR(255),
        stallholder_id INT,
        stall_id INT,
        branch_id INT,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        evidence LONGBLOB,
        status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
        resolution_notes TEXT,
        resolved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        INDEX idx_stallholder (stallholder_id),
        INDEX idx_status (status),
        INDEX idx_branch (branch_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Insert complaint
    const [result] = await connection.execute(
      `INSERT INTO complaint (
        complaint_type,
        sender_name,
        sender_contact,
        sender_email,
        stallholder_id,
        stall_id,
        branch_id,
        subject,
        description,
        evidence,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
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
        evidence|| null
      ]
    );
    
    console.log('✅ Complaint submitted successfully, ID:', result.insertId);
    
    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaint_id: result.insertId
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
    
    const [complaints] = await connection.execute(
      `SELECT 
        complaint_id,
        complaint_type,
        subject,
        description,
        status,
        resolution_notes,
        created_at,
        updated_at,
        resolved_at
       FROM complaint 
       WHERE stallholder_id = ?
       ORDER BY created_at DESC`,
      [stallholderId]
    );
    
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
