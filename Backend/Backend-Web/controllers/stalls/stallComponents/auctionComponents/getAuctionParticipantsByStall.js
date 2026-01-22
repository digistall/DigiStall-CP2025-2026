import { createConnection } from '../../../../config/database.js';

/**
 * Get all participants who joined an auction for a specific stall
 * This endpoint retrieves stallholders who clicked "Join Auction" on the mobile app
 * 
 * @route GET /api/stalls/auctions/stall/:stallId/participants
 */
export const getAuctionParticipantsByStall = async (req, res) => {
  let connection;
  try {
    const { stallId } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log('🔨 Getting auction participants for stall:', stallId);
    console.log('👤 Requested by:', { userType, userId });

    if (!stallId) {
      return res.status(400).json({
        success: false,
        message: 'Stall ID is required'
      });
    }

    connection = await createConnection();

    // First, verify the stall exists and is an auction stall
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

    // Check if stall is an auction type
    if (stall.price_type !== 'Auction') {
      return res.status(400).json({
        success: false,
        message: 'This stall is not an auction stall'
      });
    }

    // Get the auction for this stall
    const [auctionInfo] = await connection.execute(
      `SELECT 
        a.auction_id,
        a.status,
        a.starting_bid,
        a.minimum_increment,
        a.start_date,
        a.end_date,
        a.created_at
      FROM auction a
      WHERE a.stall_id = ?
      ORDER BY a.created_at DESC
      LIMIT 1`,
      [stallId]
    );

    // Get participants from auction_participants table
    let participants = [];
    let auctionData = null;

    if (auctionInfo.length > 0) {
      auctionData = auctionInfo[0];
      
      // Get all participants who joined this auction
      // Join with stallholder first, then fallback to applicant
      const [participantsList] = await connection.execute(
        `SELECT 
          ap.participant_id,
          ap.applicant_id,
          ap.stallholder_id,
          ap.registration_date,
          ap.status as participant_status,
          ap.created_at as joined_at,
          -- Get stallholder info if available
          sh.stallholder_id as sh_id,
          sh.stallholder_name as sh_name,
          sh.contact_number as sh_contact,
          sh.email as sh_email,
          sh.address as sh_address,
          sh.business_name as sh_business,
          -- Get applicant info as fallback
          a.applicant_id as app_id,
          a.applicant_full_name as app_name,
          a.applicant_contact_number as app_contact,
          a.applicant_email as app_email,
          a.applicant_address as app_address,
          -- Get highest bid for this participant
          (SELECT MAX(ab.bid_amount) FROM auction_bids ab 
           WHERE ab.auction_id = ap.auction_id AND ab.bidder_id = ap.applicant_id) as highest_bid
        FROM auction_participants ap
        LEFT JOIN stallholder sh ON ap.stallholder_id = sh.stallholder_id
        LEFT JOIN applicant a ON ap.applicant_id = a.applicant_id
        WHERE ap.auction_id = ?
        ORDER BY ap.registration_date ASC`,
        [auctionData.auction_id]
      );

      participants = participantsList.map((p, index) => ({
        participantId: p.participant_id,
        applicantId: p.applicant_id,
        stallholderId: p.stallholder_id,
        participantNumber: index + 1,
        joinedAt: p.registration_date || p.joined_at,
        status: p.participant_status,
        highestBid: p.highest_bid || 0,
        personalInfo: {
          // Prefer stallholder info, fallback to applicant
          fullName: p.sh_name || p.app_name || 'Unknown',
          email: p.sh_email || p.app_email || 'N/A',
          contactNumber: p.sh_contact || p.app_contact || 'N/A',
          address: p.sh_address || p.app_address || 'N/A',
          businessName: p.sh_business || 'N/A'
        }
      }));
    }

    console.log(`✅ Found ${participants.length} auction participants for stall ${stall.stall_no}`);

    res.json({
      success: true,
      message: 'Auction participants retrieved successfully',
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
        auctionStatus: stall.raffle_auction_status,
        startTime: stall.raffle_auction_start_time,
        endTime: stall.raffle_auction_end_time
      },
      auctionInfo: auctionData ? {
        auctionId: auctionData.auction_id,
        status: auctionData.status,
        startingBid: auctionData.starting_bid,
        minimumIncrement: auctionData.minimum_increment,
        startDate: auctionData.start_date,
        endDate: auctionData.end_date,
        createdAt: auctionData.created_at
      } : null
    });

  } catch (error) {
    console.error('❌ Error getting auction participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve auction participants',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

export default getAuctionParticipantsByStall;
