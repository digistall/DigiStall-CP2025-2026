import { createConnection } from '../config/database.js'

// ===== SUBMIT MOBILE APPLICATION =====
// Handles both regular applications and raffle joins
// For raffle stalls: saves to application table + raffle_participants table
export const submitMobileApplication = async (req, res) => {
  let connection;
  
  console.log('📱 ====== SUBMIT MOBILE APPLICATION START ======');
  console.log('📱 Request method:', req.method);
  console.log('📱 Request URL:', req.url);
  console.log('📱 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📱 Request body (raw):', JSON.stringify(req.body, null, 2));
  
  try {
    console.log('🔌 Establishing database connection...');
    connection = await createConnection();
    console.log('✅ Database connection established');
    
    const { 
      applicantId, 
      stallId, 
      businessName, 
      businessType, 
      preferredArea,
      documentUrls 
    } = req.body;

    console.log('📱 Extracted request data:', {
      applicantId,
      applicantIdType: typeof applicantId,
      stallId,
      stallIdType: typeof stallId,
      businessName,
      businessType
    });

    // Validation: Check if all required fields are provided
    if (!applicantId || !stallId) {
      console.error('❌ VALIDATION FAILED: Missing required fields');
      console.error('   - applicantId present:', !!applicantId);
      console.error('   - stallId present:', !!stallId);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantId and stallId are required'
      });
    }

    console.log('✅ Validation passed, querying stall details...');

    // Get stall details including price_type using direct query
    const [stallRows] = await connection.execute(
      `SELECT 
        s.stall_id, s.stall_number, s.stall_location, s.rental_price,
        s.price_type, s.is_available, s.status, s.raffle_auction_status,
        b.branch_id, b.branch_name
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );
    
    console.log('📊 Stall query result count:', stallRows?.length || 0);

    if (!stallRows || stallRows.length === 0) {
      console.error('❌ Stall not found for stallId:', stallId);
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallRows[0];
    const isRaffleStall = stall.price_type === 'Raffle';
    
    console.log('📊 Stall found:', JSON.stringify(stall, null, 2));
    console.log('📊 Is Raffle stall:', isRaffleStall);

    console.log('📊 Stall details:', {
      stallId: stall.stall_id,
      stallNumber: stall.stall_number,
      priceType: stall.price_type,
      isRaffle: isRaffleStall,
      branchId: stall.branch_id,
      isAvailable: stall.is_available,
      status: stall.status
    });

    // Check if stall is available
    if (stall.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Stall is not available for application'
      });
    }

    // For Raffle/Auction stalls, check if the raffle/auction is accepting applications
    if (stall.price_type === 'Raffle' || stall.price_type === 'Auction') {
      if (stall.raffle_auction_status !== 'Active' && stall.raffle_auction_status !== 'Not Started') {
        return res.status(400).json({
          success: false,
          message: `This ${stall.price_type} stall is not currently accepting applications`
        });
      }
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
        `SELECT raffle_id, status FROM raffle WHERE stall_id = ? ORDER BY created_at DESC LIMIT 1`,
        [stallId]
      );

      let raffleId;

      // If no raffle exists for this stall, create one
      if (!raffleRows || raffleRows.length === 0) {
        console.log('🆕 Creating new raffle entry for stall:', stallId);
        
        const [newRaffleResult] = await connection.execute(
          `INSERT INTO raffle (stall_id, branch_id, raffle_name, start_date, end_date, status, created_at)
           VALUES (?, ?, CONCAT('Raffle for Stall ', ?), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Open', NOW())`,
          [stallId, stall.branch_id, stall.stall_number]
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

      // Add participant to raffle_participants table (using correct columns)
      const [participantResult] = await connection.execute(
        `INSERT INTO raffle_participants (raffle_id, applicant_id, registration_date, status)
         VALUES (?, ?, NOW(), 'Registered')`,
        [raffleId, applicantId]
      );

      console.log('✅ Raffle participant added with ID:', participantResult.insertId);

      // Update raffle status to Open if scheduled
      await connection.execute(
        `UPDATE raffle SET status = 'Open' WHERE raffle_id = ? AND status = 'Scheduled'`,
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
        stallNumber: stall.stall_number,
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
        stallNumber: stall.stall_number,
        stallLocation: stall.stall_location,
        branchName: stall.branch_name,
        priceType: stall.price_type,
        isRaffle: isRaffleStall,
        status: 'Pending'
      }
    });
    console.log('📱 ====== SUBMIT MOBILE APPLICATION SUCCESS ======');
    
  } catch (error) {
    console.error('❌ ====== SUBMIT MOBILE APPLICATION ERROR ======');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ SQL State:', error.sqlState);
    console.error('❌ Error code:', error.code);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({
      success: false,
      message: 'Failed to submit pre-registration',
      error: error.message,
      errorDetails: {
        name: error.name,
        code: error.code,
        sqlState: error.sqlState
      }
    });
  } finally {
    console.log('🔚 Closing database connection...');
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
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
  
  console.log('🎰 ====== BACKEND: JOIN RAFFLE START ======');
  console.log('🎰 Request method:', req.method);
  console.log('🎰 Request URL:', req.url);
  console.log('🎰 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🎰 Request body (raw):', JSON.stringify(req.body, null, 2));
  
  try {
    connection = await createConnection();
    console.log('✅ Database connection established');
    
    const { applicantId, stallId: rawStallId } = req.body;

    // Handle stallId being passed as an object (from mobile app) or as a number
    const stallId = typeof rawStallId === 'object' && rawStallId !== null 
      ? (rawStallId.id || rawStallId.stall_id || rawStallId.stallId)
      : rawStallId;

    console.log('🎰 Extracted values:');
    console.log('   - applicantId:', applicantId, '(type:', typeof applicantId, ')');
    console.log('   - rawStallId:', rawStallId, '(type:', typeof rawStallId, ')');
    console.log('   - stallId (normalized):', stallId, '(type:', typeof stallId, ')');

    // Validation
    if (!applicantId || !stallId) {
      console.error('❌ VALIDATION FAILED: Missing required fields');
      console.error('   - applicantId present:', !!applicantId);
      console.error('   - stallId present:', !!stallId);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantId and stallId are required'
      });
    }

    console.log('✅ Validation passed, querying stall details...');

    // Get stall details to verify it's a raffle stall
    const [stallRows] = await connection.execute(
      `SELECT 
        s.stall_id, s.stall_number, s.stall_location, s.rental_price,
        s.price_type, s.is_available, s.status,
        b.branch_id, b.branch_name
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    console.log('📊 Stall query result count:', stallRows?.length || 0);

    if (!stallRows || stallRows.length === 0) {
      console.error('❌ Stall not found for stallId:', stallId);
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallRows[0];
    console.log('📊 Stall found:', JSON.stringify(stall, null, 2));

    // Verify it's a raffle stall
    if (stall.price_type !== 'Raffle') {
      console.error('❌ Not a raffle stall - price_type:', stall.price_type);
      return res.status(400).json({
        success: false,
        message: 'This stall is not a raffle stall'
      });
    }

    console.log('📊 Raffle Stall:', {
      stallId: stall.stall_id,
      stallNumber: stall.stall_number,
      branchName: stall.branch_name
    });

    // Check if user already joined this raffle
    console.log('🔍 Checking if user already joined raffle...');
    const [existingParticipant] = await connection.execute(
      `SELECT participant_id FROM raffle_participants rp
       JOIN raffle r ON rp.raffle_id = r.raffle_id
       WHERE rp.applicant_id = ? AND r.stall_id = ?`,
      [applicantId, stallId]
    );
    
    console.log('🔍 Existing participant check result:', existingParticipant?.length || 0, 'records found');

    if (existingParticipant && existingParticipant.length > 0) {
      console.error('❌ User already joined this raffle - participant_id:', existingParticipant[0].participant_id);
      return res.status(400).json({
        success: false,
        message: 'You have already joined this raffle'
      });
    }

    // Get or create raffle for this stall
    console.log('🔍 Looking for existing raffle for stall:', stallId);
    let [raffleRows] = await connection.execute(
      `SELECT raffle_id, status, 
       (SELECT COUNT(*) FROM raffle_participants WHERE raffle_id = raffle.raffle_id) as total_participants
       FROM raffle WHERE stall_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [stallId]
    );
    
    console.log('🔍 Raffle query result:', raffleRows?.length || 0, 'records found');

    let raffleId;

    // If no raffle exists, create one
    if (!raffleRows || raffleRows.length === 0) {
      console.log('🆕 Creating new raffle for stall:', stallId);
      
      // Get the business manager for this branch (required for raffle creation)
      const branchId = stall.branch_id;
      console.log('🔍 Looking for business manager for branch:', branchId);
      
      const [managerRows] = await connection.execute(
        `SELECT business_manager_id FROM business_manager 
         WHERE branch_id = ? AND status = 'Active' 
         ORDER BY business_manager_id LIMIT 1`,
        [branchId]
      );
      
      // Use the branch's business manager, or default to 1 if none found (system-created raffle)
      const businessManagerId = managerRows && managerRows.length > 0 
        ? managerRows[0].business_manager_id 
        : 1;
      console.log('📊 Using business_manager_id:', businessManagerId);
      
      try {
        const [newRaffleResult] = await connection.execute(
          `INSERT INTO raffle (stall_id, branch_id, raffle_name, start_date, end_date, status, created_by, created_at)
           VALUES (?, ?, CONCAT('Raffle for Stall ', ?), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Open', ?, NOW())`,
          [stallId, branchId, stall.stall_number, businessManagerId]
        );
        raffleId = newRaffleResult.insertId;
        console.log('✅ New raffle created with ID:', raffleId);
      } catch (insertError) {
        console.error('❌ Failed to create new raffle:', insertError.message);
        throw insertError;
      }
    } else {
      raffleId = raffleRows[0].raffle_id;
      console.log('✅ Using existing raffle - ID:', raffleId, 'Status:', raffleRows[0].status);
    }

    // Insert into raffle_participants table
    // Note: application_id is NULL for pre-registration (joining raffle only, no full application yet)
    // The application will be created when the winner is selected by the branch manager
    console.log('📝 Inserting participant into raffle_participants...');
    console.log('   - raffleId:', raffleId);
    console.log('   - applicantId:', applicantId);
    
    try {
      // Add participant to raffle_participants table (using correct columns: raffle_id, applicant_id, registration_date, status)
      const [participantResult] = await connection.execute(
        `INSERT INTO raffle_participants 
         (raffle_id, applicant_id, registration_date, status)
         VALUES (?, ?, NOW(), 'Registered')`,
        [raffleId, applicantId]
      );

      const participantId = participantResult.insertId;
      console.log('✅ Raffle participant added:', { participantId, raffleId, applicantId });

      // Update raffle status to Open if not already (total_participants is calculated via subquery, not stored)
      console.log('📝 Updating raffle status...');
      await connection.execute(
        `UPDATE raffle SET 
          status = 'Open'
        WHERE raffle_id = ? AND status = 'Scheduled'`,
        [raffleId]
      );
      console.log('✅ Raffle status checked/updated');

      // Update stall's raffle_auction_status
      console.log('📝 Updating stall raffle_auction_status...');
      await connection.execute(
        `UPDATE stall SET 
          raffle_auction_status = 'Active',
          deadline_active = 1
        WHERE stall_id = ?`,
        [stallId]
      );
      console.log('✅ Stall status updated');

      console.log('🎰 ====== BACKEND: JOIN RAFFLE SUCCESS ======');
      res.status(201).json({
        success: true,
        message: 'Successfully joined the raffle!',
        data: {
          participantId: participantId,
          raffleId: raffleId,
          stallId: stallId,
          stallNumber: stall.stall_number,
          stallLocation: stall.stall_location,
          branchName: stall.branch_name,
          joinedAt: new Date().toISOString()
        }
      });
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError.message);
      console.error('❌ SQL State:', dbError.sqlState);
      console.error('❌ Error code:', dbError.code);
      throw dbError;
    }
    
  } catch (error) {
    console.error('❌ ====== BACKEND: JOIN RAFFLE ERROR ======');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({
      success: false,
      message: 'Failed to join raffle',
      error: error.message,
      errorDetails: {
        name: error.name,
        code: error.code,
        sqlState: error.sqlState
      }
    });
  } finally {
    console.log('🔚 Closing database connection...');
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
};

// ===== JOIN AUCTION =====
// Endpoint to join an auction - inserts into auction_participants table
export const joinAuction = async (req, res) => {
  let connection;
  
  console.log('🔨 ====== BACKEND: JOIN AUCTION START ======');
  console.log('🔨 Request method:', req.method);
  console.log('🔨 Request URL:', req.url);
  console.log('🔨 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔨 Request body (raw):', JSON.stringify(req.body, null, 2));
  
  try {
    connection = await createConnection();
    console.log('✅ Database connection established');
    
    const { applicantId, stallId: rawStallId } = req.body;

    // Handle stallId being passed as an object (from mobile app) or as a number
    const stallId = typeof rawStallId === 'object' && rawStallId !== null 
      ? (rawStallId.id || rawStallId.stall_id || rawStallId.stallId)
      : rawStallId;

    console.log('🔨 Extracted values:');
    console.log('   - applicantId:', applicantId, '(type:', typeof applicantId, ')');
    console.log('   - rawStallId:', rawStallId, '(type:', typeof rawStallId, ')');
    console.log('   - stallId (normalized):', stallId, '(type:', typeof stallId, ')');

    // Validation
    if (!applicantId || !stallId) {
      console.error('❌ VALIDATION FAILED: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantId and stallId are required'
      });
    }

    console.log('✅ Validation passed, querying stall details...');

    // Get stall details to verify it's an auction stall
    const [stallRows] = await connection.execute(
      `SELECT 
        s.stall_id, s.stall_number, s.stall_location, s.rental_price,
        s.price_type, s.is_available, s.status, s.description,
        s.amenities, s.area_sqm, s.raffle_auction_status,
        f.floor_level,
        sec.section,
        b.branch_id, b.branch_name
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    console.log('📊 Stall query result count:', stallRows?.length || 0);

    if (!stallRows || stallRows.length === 0) {
      console.error('❌ Stall not found for stallId:', stallId);
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallRows[0];
    console.log('📊 Stall found:', JSON.stringify(stall, null, 2));

    // Verify it's an auction stall
    if (stall.price_type !== 'Auction') {
      console.error('❌ Not an auction stall - price_type:', stall.price_type);
      return res.status(400).json({
        success: false,
        message: 'This stall is not an auction stall'
      });
    }

    console.log('📊 Auction Stall:', {
      stallId: stall.stall_id,
      stallNumber: stall.stall_number,
      branchName: stall.branch_name
    });

    // Check if user already joined this auction
    console.log('🔍 Checking if user already joined auction...');
    const [existingParticipant] = await connection.execute(
      `SELECT participant_id FROM auction_participants ap
       JOIN auction a ON ap.auction_id = a.auction_id
       WHERE ap.applicant_id = ? AND a.stall_id = ?`,
      [applicantId, stallId]
    );
    
    console.log('🔍 Existing participant check result:', existingParticipant?.length || 0, 'records found');

    if (existingParticipant && existingParticipant.length > 0) {
      console.error('❌ User already joined this auction - participant_id:', existingParticipant[0].participant_id);
      return res.status(400).json({
        success: false,
        message: 'You have already joined this auction'
      });
    }

    // Get or create auction for this stall
    console.log('🔍 Looking for existing auction for stall:', stallId);
    let [auctionRows] = await connection.execute(
      `SELECT auction_id, status 
       FROM auction WHERE stall_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [stallId]
    );
    
    console.log('🔍 Auction query result:', auctionRows?.length || 0, 'records found');

    let auctionId;

    // If no auction exists, create one
    if (!auctionRows || auctionRows.length === 0) {
      console.log('🆕 Creating new auction for stall:', stallId);
      
      // Get the business manager for this branch
      const branchId = stall.branch_id;
      console.log('🔍 Looking for business manager for branch:', branchId);
      
      const [managerRows] = await connection.execute(
        `SELECT business_manager_id FROM business_manager 
         WHERE branch_id = ? AND status = 'Active' 
         ORDER BY business_manager_id LIMIT 1`,
        [branchId]
      );
      
      const businessManagerId = managerRows && managerRows.length > 0 
        ? managerRows[0].business_manager_id 
        : 1;
      console.log('📊 Using business_manager_id:', businessManagerId);
      
      try {
        const [newAuctionResult] = await connection.execute(
          `INSERT INTO auction (stall_id, branch_id, auction_name, starting_bid, minimum_increment, start_date, end_date, status, created_by, created_at)
           VALUES (?, ?, CONCAT('Auction for Stall ', ?), ?, 100.00, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Open', ?, NOW())`,
          [stallId, branchId, stall.stall_number, stall.rental_price || 1000.00, businessManagerId]
        );
        auctionId = newAuctionResult.insertId;
        console.log('✅ New auction created with ID:', auctionId);
      } catch (insertError) {
        console.error('❌ Failed to create new auction:', insertError.message);
        throw insertError;
      }
    } else {
      auctionId = auctionRows[0].auction_id;
      console.log('✅ Using existing auction - ID:', auctionId, 'Status:', auctionRows[0].status);
    }

    // Insert into auction_participants table
    console.log('📝 Inserting participant into auction_participants...');
    console.log('   - auctionId:', auctionId);
    console.log('   - applicantId:', applicantId);
    
    try {
      const [participantResult] = await connection.execute(
        `INSERT INTO auction_participants 
         (auction_id, applicant_id, registration_date, status)
         VALUES (?, ?, NOW(), 'Registered')`,
        [auctionId, applicantId]
      );

      const participantId = participantResult.insertId;
      console.log('✅ Auction participant added:', { participantId, auctionId, applicantId });

      // Update auction status to Open if scheduled
      console.log('📝 Updating auction status...');
      await connection.execute(
        `UPDATE auction SET 
          status = 'Open'
        WHERE auction_id = ? AND status = 'Scheduled'`,
        [auctionId]
      );
      console.log('✅ Auction status checked/updated');

      // Update stall's raffle_auction_status
      console.log('📝 Updating stall raffle_auction_status...');
      await connection.execute(
        `UPDATE stall SET 
          raffle_auction_status = 'Active',
          deadline_active = 1
        WHERE stall_id = ?`,
        [stallId]
      );
      console.log('✅ Stall status updated');

      console.log('🔨 ====== BACKEND: JOIN AUCTION SUCCESS ======');
      res.status(201).json({
        success: true,
        message: 'Successfully joined the auction!',
        data: {
          participantId: participantId,
          auctionId: auctionId,
          stallId: stallId,
          stallNumber: stall.stall_number,
          stallLocation: stall.stall_location,
          branchName: stall.branch_name,
          startingBid: stall.rental_price,
          joinedAt: new Date().toISOString()
        }
      });
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError.message);
      console.error('❌ SQL State:', dbError.sqlState);
      console.error('❌ Error code:', dbError.code);
      throw dbError;
    }
    
  } catch (error) {
    console.error('❌ ====== BACKEND: JOIN AUCTION ERROR ======');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({
      success: false,
      message: 'Failed to join auction',
      error: error.message,
      errorDetails: {
        name: error.name,
        code: error.code,
        sqlState: error.sqlState
      }
    });
  } finally {
    console.log('🔚 Closing database connection...');
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
};