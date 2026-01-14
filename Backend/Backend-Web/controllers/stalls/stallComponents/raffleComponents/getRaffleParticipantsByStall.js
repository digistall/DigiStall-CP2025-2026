import { createConnection } from '../../../../config/database.js';

/**
 * Get all participants who joined a raffle for a specific stall
 * This endpoint retrieves users who clicked "Join Raffle" on the mobile app
 * 
 * @route GET /api/stalls/raffles/stall/:stallId/participants
 */
export const getRaffleParticipantsByStall = async (req, res) => {
  let connection;
  try {
    const { stallId } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log('🎰 Getting raffle participants for stall:', stallId);
    console.log('👤 Requested by:', { userType, userId });

    if (!stallId) {
      return res.status(400).json({
        success: false,
        message: 'Stall ID is required'
      });
    }

    connection = await createConnection();

    // First, verify the stall exists and is a raffle stall
    const [stallInfo] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        s.price_type,
        s.raffle_auction_status,
        s.raffle_auction_start_time,
        s.raffle_auction_end_time,
        b.branch_name,
        b.branch_id,
        f.floor_name,
        sec.section_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    if (!stallInfo.length) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallInfo[0];

    // Check if stall is a raffle type
    if (stall.price_type !== 'Raffle') {
      return res.status(400).json({
        success: false,
        message: 'This stall is not a raffle stall'
      });
    }

    // Get the raffle for this stall
    const [raffleInfo] = await connection.execute(
      `SELECT 
        r.raffle_id,
        r.raffle_status,
        r.total_participants,
        r.start_time,
        r.end_time,
        r.winner_applicant_id,
        r.created_at
      FROM raffle r
      WHERE r.stall_id = ?
      ORDER BY r.created_at DESC
      LIMIT 1`,
      [stallId]
    );

    // Get participants from raffle_participants table
    let participants = [];
    let raffleData = null;

    if (raffleInfo.length > 0) {
      raffleData = raffleInfo[0];
      
      // Get all participants who joined this raffle
      const [participantsList] = await connection.execute(
        `SELECT 
          rp.participant_id,
          rp.applicant_id,
          rp.application_id,
          rp.participation_time,
          rp.is_winner,
          rp.created_at as joined_at,
          a.applicant_full_name,
          a.applicant_contact_number,
          a.applicant_address,
          a.applicant_email,
          app.application_date,
          app.business_name,
          app.business_type,
          app.application_status
        FROM raffle_participants rp
        INNER JOIN applicant a ON rp.applicant_id = a.applicant_id
        LEFT JOIN stall_application app ON rp.application_id = app.application_id
        WHERE rp.raffle_id = ?
        ORDER BY rp.participation_time ASC`,
        [raffleData.raffle_id]
      );

      participants = participantsList.map((p, index) => ({
        participantId: p.participant_id,
        applicantId: p.applicant_id,
        applicationId: p.application_id,
        participantNumber: index + 1,
        isWinner: p.is_winner === 1,
        joinedAt: p.participation_time || p.joined_at,
        personalInfo: {
          fullName: p.applicant_full_name || 'Unknown',
          email: p.applicant_email || 'N/A',
          contactNumber: p.applicant_contact_number || 'N/A',
          address: p.applicant_address || 'N/A'
        },
        businessInfo: {
          name: p.business_name || 'N/A',
          type: p.business_type || 'N/A'
        },
        applicationInfo: {
          applicationDate: p.application_date,
          status: p.application_status || 'Participating'
        }
      }));
    }

    console.log(`✅ Found ${participants.length} raffle participants for stall ${stall.stall_no}`);

    res.json({
      success: true,
      message: 'Raffle participants retrieved successfully',
      data: participants,
      count: participants.length,
      stallInfo: {
        stallId: stall.stall_id,
        stallNumber: stall.stall_no,
        location: stall.stall_location,
        rentalPrice: stall.rental_price,
        branchName: stall.branch_name,
        floorName: stall.floor_name,
        sectionName: stall.section_name,
        raffleStatus: stall.raffle_auction_status,
        startTime: stall.raffle_auction_start_time,
        endTime: stall.raffle_auction_end_time
      },
      raffleInfo: raffleData ? {
        raffleId: raffleData.raffle_id,
        status: raffleData.raffle_status,
        totalParticipants: raffleData.total_participants,
        startTime: raffleData.start_time,
        endTime: raffleData.end_time,
        hasWinner: raffleData.winner_applicant_id !== null,
        createdAt: raffleData.created_at
      } : null
    });

  } catch (error) {
    console.error('❌ Error getting raffle participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve raffle participants',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

export default getRaffleParticipantsByStall;
