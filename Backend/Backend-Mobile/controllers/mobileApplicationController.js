import { createConnection } from '../../config/database.js'

// ===== SUBMIT MOBILE APPLICATION =====
export const submitMobileApplication = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { 
      applicantId, 
      stallId, 
      businessName, 
      businessType, 
      preferredArea,
      documentUrls 
    } = req.body;

    console.log('📱 Mobile Application Submission:', {
      applicantId,
      stallId,
      businessName,
      businessType,
      preferredArea
    });

    // Validation: Check if all required fields are provided
    if (!applicantId || !stallId || !businessName || !businessType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantId, stallId, businessName, businessType'
      });
    }

    // Check if stall exists and is available
    const [stallCheck] = await connection.execute(
      'SELECT stall_id, stall_name, area, branch_id, is_available FROM stalls WHERE stall_id = ?',
      [stallId]
    );

    if (stallCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallCheck[0];
    if (!stall.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Stall is not available for application'
      });
    }

    // Check if user already applied for this specific stall
    const [existingApplication] = await connection.execute(
      'SELECT application_id FROM applications WHERE applicant_id = ? AND stall_id = ?',
      [applicantId, stallId]
    );

    if (existingApplication.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this stall'
      });
    }

    // BUSINESS RULE: Check 2-stall-per-branch limit
    const [branchApplicationCount] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM applications a 
       JOIN stalls s ON a.stall_id = s.stall_id 
       WHERE a.applicant_id = ? AND s.branch_id = ? AND a.status != 'rejected'`,
      [applicantId, stall.branch_id]
    );

    if (branchApplicationCount[0].count >= 2) {
      return res.status(400).json({
        success: false,
        message: `You can only have 2 stall applications per branch. You already have ${branchApplicationCount[0].count} applications in this branch.`
      });
    }
    
    // Insert application
    const [result] = await connection.execute(
      `INSERT INTO applications 
       (applicant_id, stall_id, business_name, business_type, preferred_area, 
        document_urls, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [applicantId, stallId, businessName, businessType, preferredArea, documentUrls ? JSON.stringify(documentUrls) : null]
    );

    console.log('✅ Mobile application submitted successfully:', {
      applicationId: result.insertId,
      stallName: stall.stall_name,
      area: stall.area
    });
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.insertId,
        stallName: stall.stall_name,
        area: stall.area,
        status: 'pending'
      }
    });
    
  } catch (error) {
    console.error('❌ Submit mobile application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== GET MOBILE USER APPLICATIONS =====
export const getMobileUserApplications = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const userId = req.user.userId;
    
    const [applications] = await connection.execute(
      `SELECT a.*, s.stall_name, s.area, s.location 
       FROM applications a 
       LEFT JOIN stalls s ON a.stall_id = s.stall_id 
       WHERE a.applicant_id = ? 
       ORDER BY a.created_at DESC`,
      [userId]
    );
    
    res.status(200).json({
      success: true,
      applications
    });
    
  } catch (error) {
    console.error('Get mobile user applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== GET MOBILE APPLICATION STATUS =====
export const getMobileApplicationStatus = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { id } = req.params;
    const userId = req.user.userId;
    
    const [applications] = await connection.execute(
      `SELECT a.*, s.stall_name, s.area, s.location 
       FROM applications a 
       LEFT JOIN stalls s ON a.stall_id = s.stall_id 
       WHERE a.application_id = ? AND a.applicant_id = ?`,
      [id, userId]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.status(200).json({
      success: true,
      application: applications[0]
    });
    
  } catch (error) {
    console.error('Get mobile application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application status',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== UPDATE MOBILE APPLICATION =====
export const updateMobileApplication = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { id } = req.params;
    const userId = req.user.userId;
    const { 
      businessName, 
      businessType, 
      preferredArea,
      documentUrls 
    } = req.body;
    
    // Check if application belongs to user and is still pending
    const [existing] = await connection.execute(
      'SELECT * FROM applications WHERE application_id = ? AND applicant_id = ? AND status = "pending"',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be updated'
      });
    }
    
    // Update application
    await connection.execute(
      `UPDATE applications 
       SET business_name = ?, business_type = ?, preferred_area = ?, 
           document_urls = ?, updated_at = NOW() 
       WHERE application_id = ? AND applicant_id = ?`,
      [businessName, businessType, preferredArea, JSON.stringify(documentUrls), id, userId]
    );
    
    res.status(200).json({
      success: true,
      message: 'Application updated successfully'
    });
    
  } catch (error) {
    console.error('Update mobile application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};