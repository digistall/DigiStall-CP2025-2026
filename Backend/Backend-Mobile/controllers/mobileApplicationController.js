import { createConnection } from '../config/database.js'

// ===== SUBMIT MOBILE APPLICATION =====
// Handles both regular applications and raffle joins
// For raffle stalls: saves to application table + raffle_participants table
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
      businessType
    });

    // Validation: Check if all required fields are provided
    if (!applicantId || !stallId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantId and stallId are required'
      });
    }

    // Get stall details including price_type using direct query
    const [stallRows] = await connection.execute(
      `SELECT 
        s.stall_id, s.stall_no, s.stall_location, s.rental_price,
        s.price_type, s.is_available, s.status, s.raffle_auction_status,
        b.branch_id, b.branch_name
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    if (!stallRows || stallRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallRows[0];
    const isRaffleStall = stall.price_type === 'Raffle';

    console.log('📊 Stall details:', {
      stallId: stall.stall_id,
      stallNo: stall.stall_no,
      priceType: stall.price_type,
      isRaffle: isRaffleStall,
      branchId: stall.branch_id,
      isAvailable: stall.is_available,
      status: stall.status
    });

    // Check if stall is available
    if (!stall.is_available || stall.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Stall is not available for application'
      });
    }

    // Check if user already applied for this specific stall
    const [existingRows] = await connection.execute(
      `SELECT application_id FROM application 
       WHERE applicant_id = ? AND stall_id = ?`,
      [applicantId, stallId]
    );

    if (existingRows && existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: isRaffleStall 
          ? 'You have already joined this raffle' 
          : 'You have already applied for this stall'
      });
    }

    // BUSINESS RULE: Check 2-stall-per-branch limit
    const [branchCountRows] = await connection.execute(
      `SELECT COUNT(*) as count FROM application a
       JOIN stall s ON a.stall_id = s.stall_id
       LEFT JOIN section sec ON s.section_id = sec.section_id
       LEFT JOIN floor f ON sec.floor_id = f.floor_id
       WHERE a.applicant_id = ? AND f.branch_id = ?`,
      [applicantId, stall.branch_id]
    );

    const branchCount = branchCountRows[0]?.count || 0;
    
    if (branchCount >= 2) {
      return res.status(400).json({
        success: false,
        message: `You can only have 2 stall applications per branch. You already have ${branchCount} applications in ${stall.branch_name || 'this branch'}.`
      });
    }
    
    // Create the application - insert directly to application table
    const [insertResult] = await connection.execute(
      `INSERT INTO application (stall_id, applicant_id, application_date, application_status)
       VALUES (?, ?, CURDATE(), 'Pending')`,
      [stallId, applicantId]
    );

    const applicationId = insertResult.insertId;
    console.log('✅ Application created with ID:', applicationId);

    // If this is a raffle stall, also add to raffle_participants
    if (isRaffleStall) {
      // Get or create the raffle for this stall
      let [raffleRows] = await connection.execute(
        `SELECT raffle_id, raffle_status, total_participants 
         FROM raffle WHERE stall_id = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [stallId]
      );

      let raffleId;

      // If no raffle exists for this stall, create one
      if (!raffleRows || raffleRows.length === 0) {
        console.log('🆕 Creating new raffle entry for stall:', stallId);
        
        const [newRaffleResult] = await connection.execute(
          `INSERT INTO raffle (stall_id, raffle_status, total_participants, created_at)
           VALUES (?, 'Active', 0, NOW())`,
          [stallId]
        );
        raffleId = newRaffleResult.insertId;
        console.log('✅ New raffle created with ID:', raffleId);
      } else {
        raffleId = raffleRows[0].raffle_id;
      }

      console.log('🎰 Adding to raffle_participants:', {
        raffleId,
        applicantId,
        applicationId
      });

      // Add participant to raffle_participants table
      const [participantResult] = await connection.execute(
        `INSERT INTO raffle_participants (raffle_id, applicant_id, application_id, participation_time, is_winner, created_at)
         VALUES (?, ?, ?, NOW(), 0, NOW())`,
        [raffleId, applicantId, applicationId]
      );

      console.log('✅ Raffle participant added with ID:', participantResult.insertId);

      // Update raffle total_participants count
      await connection.execute(
        `UPDATE raffle SET 
          total_participants = total_participants + 1,
          first_application_time = COALESCE(first_application_time, NOW()),
          raffle_status = 'Active'
        WHERE raffle_id = ?`,
        [raffleId]
      );

      // Update stall's raffle_auction_status
      await connection.execute(
        `UPDATE stall SET 
          raffle_auction_status = 'Active',
          deadline_active = 1
        WHERE stall_id = ?`,
        [stallId]
      );

      console.log('✅ Successfully joined raffle:', {
        raffleId,
        stallNo: stall.stall_no,
        participantId: participantResult.insertId
      });
    }

    res.status(201).json({
      success: true,
      message: isRaffleStall 
        ? 'Successfully joined the raffle!' 
        : 'Application submitted successfully',
      data: {
        applicationId: applicationId,
        stallId: stallId,
        stallNo: stall.stall_no,
        stallLocation: stall.stall_location,
        branchName: stall.branch_name,
        priceType: stall.price_type,
        isRaffle: isRaffleStall,
        status: 'Pending'
      }
    });
    
  } catch (error) {
    console.error('❌ Submit mobile pre-registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit pre-registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
      message: 'Failed to get pre-registrations',
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
    
    // Check if pre-registration belongs to user and is still pending
    const [existing] = await connection.execute(
      'CALL checkPendingApplication(?, ?)',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'pre-registration not found or cannot be updated'
      });
    }
    
    // Update application using stored procedure
    await connection.execute(
      'CALL updateMobileApplication(?, ?, ?, ?, ?, ?)',
      [id, userId, businessName, businessType, preferredArea, JSON.stringify(documentUrls)]
    );
    
    res.status(200).json({
      success: true,
      message: 'Pre-registration updated successfully'
    });
    
  } catch (error) {
    console.error('Update mobile pre-registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pre-registration',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== JOIN RAFFLE =====
// Simple endpoint to join a raffle - only inserts into raffle_participants table
export const joinRaffle = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { applicantId, stallId } = req.body;

    console.log('🎰 Join Raffle Request:', { applicantId, stallId });

    // Validation
    if (!applicantId || !stallId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantId and stallId are required'
      });
    }

    // Get stall details to verify it's a raffle stall
    const [stallRows] = await connection.execute(
      `SELECT 
        s.stall_id, s.stall_no, s.stall_location, s.rental_price,
        s.price_type, s.is_available, s.status,
        b.branch_id, b.branch_name
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    if (!stallRows || stallRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallRows[0];

    // Verify it's a raffle stall
    if (stall.price_type !== 'Raffle') {
      return res.status(400).json({
        success: false,
        message: 'This stall is not a raffle stall'
      });
    }

    console.log('📊 Raffle Stall:', {
      stallId: stall.stall_id,
      stallNo: stall.stall_no,
      branchName: stall.branch_name
    });

    // Check if user already joined this raffle
    const [existingParticipant] = await connection.execute(
      `SELECT participant_id FROM raffle_participants rp
       JOIN raffle r ON rp.raffle_id = r.raffle_id
       WHERE rp.applicant_id = ? AND r.stall_id = ?`,
      [applicantId, stallId]
    );

    if (existingParticipant && existingParticipant.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this raffle'
      });
    }

    // Get or create raffle for this stall
    let [raffleRows] = await connection.execute(
      `SELECT raffle_id, raffle_status, total_participants 
       FROM raffle WHERE stall_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [stallId]
    );

    let raffleId;

    // If no raffle exists, create one
    if (!raffleRows || raffleRows.length === 0) {
      console.log('🆕 Creating new raffle for stall:', stallId);
      
      const [newRaffleResult] = await connection.execute(
        `INSERT INTO raffle (stall_id, raffle_status, total_participants, created_at)
         VALUES (?, 'Active', 0, NOW())`,
        [stallId]
      );
      raffleId = newRaffleResult.insertId;
      console.log('✅ New raffle created with ID:', raffleId);
    } else {
      raffleId = raffleRows[0].raffle_id;
    }

    // Insert into raffle_participants table
    const [participantResult] = await connection.execute(
      `INSERT INTO raffle_participants 
       (raffle_id, applicant_id, application_id, participation_time, is_winner, created_at)
       VALUES (?, ?, NULL, NOW(), 0, NOW())`,
      [raffleId, applicantId]
    );

    const participantId = participantResult.insertId;
    console.log('✅ Raffle participant added:', { participantId, raffleId, applicantId });

    // Update raffle total_participants count
    await connection.execute(
      `UPDATE raffle SET 
        total_participants = total_participants + 1,
        first_application_time = COALESCE(first_application_time, NOW()),
        raffle_status = 'Active'
      WHERE raffle_id = ?`,
      [raffleId]
    );

    // Update stall's raffle_auction_status
    await connection.execute(
      `UPDATE stall SET 
        raffle_auction_status = 'Active',
        deadline_active = 1
      WHERE stall_id = ?`,
      [stallId]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully joined the raffle!',
      data: {
        participantId: participantId,
        raffleId: raffleId,
        stallId: stallId,
        stallNo: stall.stall_no,
        stallLocation: stall.stall_location,
        branchName: stall.branch_name,
        joinedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Join Raffle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join raffle',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};