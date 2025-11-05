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
      'CALL checkStallAvailability(?)',
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
      'CALL checkExistingApplicationByStall(?, ?)',
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
      'CALL countBranchApplications(?, ?)',
      [applicantId, stall.branch_id]
    );

    if (branchApplicationCount[0].count >= 2) {
      return res.status(400).json({
        success: false,
        message: `You can only have 2 stall applications per branch. You already have ${branchApplicationCount[0].count} applications in this branch.`
      });
    }
    
    // Insert application using stored procedure
    const [[result]] = await connection.execute(
      'CALL createMobileApplication(?, ?, ?, ?, ?, ?)',
      [applicantId, stallId, businessName, businessType, preferredArea, documentUrls ? JSON.stringify(documentUrls) : null]
    );

    console.log('✅ Mobile application submitted successfully:', {
      applicationId: result.application_id,
      stallName: stall.stall_name,
      area: stall.area
    });
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.application_id,
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
      'CALL getMobileUserApplications(?)',
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
      'CALL getMobileApplicationStatus(?, ?)',
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
      'CALL checkPendingApplication(?, ?)',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be updated'
      });
    }
    
    // Update application using stored procedure
    await connection.execute(
      'CALL updateMobileApplication(?, ?, ?, ?, ?, ?)',
      [id, userId, businessName, businessType, preferredArea, JSON.stringify(documentUrls)]
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