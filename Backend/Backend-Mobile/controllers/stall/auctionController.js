import { createConnection } from '../../../config/database.js';

/**
 * Pre-register for auction
 * Allows applicants to register their intent to participate in an auction
 */
export const preRegisterForAuction = async (req, res) => {
  let connection;
  
  try {
    const { applicant_id, stall_id, application_id } = req.body;

    // Validate required fields
    if (!applicant_id || !stall_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID and Stall ID are required'
      });
    }

    console.log(`🎯 Pre-registering applicant ${applicant_id} for auction on stall ${stall_id}`);

    connection = await createConnection();

    // Get auction info for the stall
    const [auctionInfo] = await connection.execute(
      `SELECT a.auction_id, a.auction_status, a.stall_id, s.stall_no, 
              s.rental_price, s.price_type, b.branch_name
       FROM auction a
       INNER JOIN stall s ON a.stall_id = s.stall_id
       INNER JOIN section sec ON s.section_id = sec.section_id
       INNER JOIN floor f ON sec.floor_id = f.floor_id
       INNER JOIN branch b ON f.branch_id = b.branch_id
       WHERE a.stall_id = ? AND s.price_type = 'Auction'`,
      [stall_id]
    );

    console.log(`📊 Auction query result for stall ${stall_id}:`, auctionInfo.length, 'records found');

    if (!auctionInfo.length) {
      return res.status(404).json({
        success: false,
        message: 'No auction found for this stall. This stall may not be available for auction.'
      });
    }

    const auction = auctionInfo[0];
    console.log(`✅ Found auction ID: ${auction.auction_id}, Status: ${auction.auction_status}`);

    // Validate auction status
    if (auction.auction_status === 'Ended') {
      return res.status(400).json({
        success: false,
        message: 'This auction has already ended'
      });
    }

    if (auction.auction_status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This auction has been cancelled'
      });
    }

    // Check if applicant is already registered
    const [existingRegistration] = await connection.execute(
      `SELECT participant_id, registration_status 
       FROM auction_participants 
       WHERE auction_id = ? AND applicant_id = ?`,
      [auction.auction_id, applicant_id]
    );

    if (existingRegistration.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already pre-registered for this auction',
        data: {
          participant_id: existingRegistration[0].participant_id,
          status: existingRegistration[0].registration_status
        }
      });
    }

    // Create application if it doesn't exist
    let finalApplicationId = application_id;
    
    if (!application_id) {
      // Check if application already exists
      const [existingApp] = await connection.execute(
        'SELECT application_id FROM application WHERE applicant_id = ? AND stall_id = ?',
        [applicant_id, stall_id]
      );

      if (existingApp.length > 0) {
        finalApplicationId = existingApp[0].application_id;
      } else {
        // Verify stall exists before creating application
        const [stallCheck] = await connection.execute(
          'SELECT stall_id FROM stall WHERE stall_id = ?',
          [stall_id]
        );

        if (stallCheck.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Stall not found. Please refresh and try again.'
          });
        }

        // Create new application directly
        const [appResult] = await connection.execute(
          'INSERT INTO application (applicant_id, stall_id, application_date, application_status) VALUES (?, ?, NOW(), ?)',
          [applicant_id, stall_id, 'Pending']
        );
        finalApplicationId = appResult.insertId;
        console.log(`📝 Created new application ID: ${finalApplicationId}`);
      }
    }

    // Register participant using stored procedure
    const [[participantResult]] = await connection.execute(
      'CALL registerAuctionParticipant(?, ?, ?, ?)',
      [auction.auction_id, stall_id, applicant_id, finalApplicationId]
    );

    console.log(`✅ Successfully pre-registered for auction. Participant ID: ${participantResult.participant_id}`);

    res.json({
      success: true,
      message: 'Successfully pre-registered for auction!',
      data: {
        participant_id: participantResult.participant_id,
        auction_id: auction.auction_id,
        stall_id: stall_id,
        stall_no: auction.stall_no,
        applicant_id: applicant_id,
        application_id: finalApplicationId,
        registration_status: participantResult.registration_status,
        registration_date: participantResult.registration_date,
        branch_name: auction.branch_name,
        starting_price: auction.rental_price
      }
    });

  } catch (error) {
    console.error('❌ Pre-register for auction error:', error);
    
    // Handle specific SQL errors
    if (error.message.includes('already registered')) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this auction'
      });
    }
    
    if (error.message.includes('not accepting registrations')) {
      return res.status(400).json({
        success: false,
        message: 'This auction is not currently accepting registrations'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to pre-register for auction. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Check if applicant is registered for auction
 */
export const checkAuctionRegistration = async (req, res) => {
  let connection;
  
  try {
    const { auctionId, applicantId } = req.params;

    connection = await createConnection();

    const [[registration]] = await connection.execute(
      'CALL checkAuctionRegistration(?, ?)',
      [auctionId, applicantId]
    );

    if (!registration) {
      return res.json({
        success: true,
        isRegistered: false,
        message: 'Not registered for this auction'
      });
    }

    res.json({
      success: true,
      isRegistered: true,
      data: registration
    });

  } catch (error) {
    console.error('❌ Check auction registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status'
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all participants for an auction
 */
export const getAuctionParticipants = async (req, res) => {
  let connection;
  
  try {
    const { auctionId } = req.params;

    connection = await createConnection();

    const [[participants]] = await connection.execute(
      'CALL getAuctionParticipants(?)',
      [auctionId]
    );

    res.json({
      success: true,
      data: participants || [],
      total: participants ? participants.length : 0
    });

  } catch (error) {
    console.error('❌ Get auction participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auction participants'
    });
  } finally {
    if (connection) await connection.end();
  }
};
