import { createConnection } from '../../../../../SHARED/CONFIG/database.js';
import { decryptData } from '../../../../../SHARED/SERVICES/encryptionService.js';

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

    console.log('ðŸ”¨ Getting auction participants for stall:', stallId);
    console.log('ðŸ‘¤ Requested by:', { userType, userId });

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
        s.stall_number,
        s.stall_location,
        s.rental_price,
        s.price_type,
        s.raffle_auction_status,
        s.raffle_auction_deadline,
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
      const [participantsList] = await connection.execute(
        `SELECT 
          ap.participant_id,
          ap.applicant_id,
          ap.stallholder_id,
          ap.bid_amount,
          ap.registration_date,
          ap.status as participant_status
        FROM auction_participants ap
        WHERE ap.auction_id = ?
        ORDER BY ap.registration_date ASC`,
        [auctionData.auction_id]
      );

      // Fetch decrypted details for each participant
      const participantsWithDetails = await Promise.all(
        participantsList.map(async (p, index) => {
          let personalInfo = {
            fullName: 'Unknown',
            email: 'N/A',
            contactNumber: 'N/A',
            address: 'N/A',
            businessName: 'N/A'
          };

          try {
            if (p.stallholder_id) {
              // Fetch stallholder details
              console.log(`Fetching stallholder details for ID: ${p.stallholder_id}`);
              const [stallholderDetails] = await connection.execute(
                `SELECT stallholder_id, full_name, email, contact_number, address
                 FROM stallholder WHERE stallholder_id = ?`,
                [p.stallholder_id]
              );
              console.log('Stallholder query result:', stallholderDetails);
              if (stallholderDetails.length > 0) {
                const sh = stallholderDetails[0];
                // Decrypt stallholder data
                personalInfo = {
                  fullName: decryptData(sh.full_name) || 'Unknown',
                  email: decryptData(sh.email) || 'N/A',
                  contactNumber: decryptData(sh.contact_number) || 'N/A',
                  address: decryptData(sh.address) || 'N/A',
                  businessName: 'Stallholder'
                };
                console.log('Decrypted stallholder info:', personalInfo);
              } else {
                console.warn(`No stallholder found for ID: ${p.stallholder_id}`);
              }
            } else if (p.applicant_id) {
              // Fetch applicant details using correct column names
              console.log(`Fetching applicant details for ID: ${p.applicant_id}`);
              const [applicantDetails] = await connection.execute(
                `SELECT applicant_id, applicant_full_name, applicant_contact_number, applicant_address
                 FROM applicant WHERE applicant_id = ?`,
                [p.applicant_id]
              );
              console.log('Applicant query result:', applicantDetails);
              
              // Try to fetch email from stallholder table using applicant_id
              let applicantEmail = 'N/A';
              const [stallholderByApplicant] = await connection.execute(
                `SELECT email, full_name FROM stallholder WHERE applicant_id = ? LIMIT 1`,
                [p.applicant_id]
              );
              if (stallholderByApplicant.length > 0 && stallholderByApplicant[0].email) {
                applicantEmail = decryptData(stallholderByApplicant[0].email) || 'N/A';
                console.log('Found email from stallholder table by applicant_id:', applicantEmail);
              }
              
              if (applicantDetails.length > 0) {
                const app = applicantDetails[0];
                const decryptedFullName = decryptData(app.applicant_full_name) || 'Unknown';
                
                // Fallback: If email not found by applicant_id, try to find by matching full_name
                if (applicantEmail === 'N/A') {
                  console.log('Email not found by applicant_id, trying to match by name...');
                  const [stallholderByName] = await connection.execute(
                    `SELECT email, full_name FROM stallholder WHERE status = 'active' LIMIT 100`
                  );
                  for (const sh of stallholderByName) {
                    const shName = decryptData(sh.full_name);
                    if (shName && shName.toLowerCase() === decryptedFullName.toLowerCase()) {
                      applicantEmail = decryptData(sh.email) || 'N/A';
                      console.log('Found email by matching name:', applicantEmail);
                      break;
                    }
                  }
                }
                
                // Decrypt applicant data using correct column names
                personalInfo = {
                  fullName: decryptedFullName,
                  email: applicantEmail,
                  contactNumber: decryptData(app.applicant_contact_number) || 'N/A',
                  address: decryptData(app.applicant_address) || 'N/A',
                  businessName: 'Applicant'
                };
                console.log('Decrypted applicant info:', personalInfo);
              } else {
                console.warn(`No applicant found for ID: ${p.applicant_id}`);
              }
            }
          } catch (err) {
            console.error(`âŒ Error fetching details for participant ${p.participant_id}:`, err);
            console.error('Error stack:', err.stack);
          }

          return {
            participantId: p.participant_id,
            applicantId: p.applicant_id,
            stallholderId: p.stallholder_id,
            participantNumber: index + 1,
            joinedAt: p.registration_date,
            status: p.participant_status,
            bidAmount: p.bid_amount || 0,
            highestBid: p.bid_amount || 0,
            isWinner: p.participant_status === 'Winner',
            personalInfo
          };
        })
      );

      participants = participantsWithDetails;
    }

    console.log(`âœ… Found ${participants.length} auction participants for stall ${stall.stall_number}`);

    res.json({
      success: true,
      message: 'Auction participants retrieved successfully',
      data: participants,
      count: participants.length,
      stallInfo: {
        stallId: stall.stall_id,
        stallNumber: stall.stall_number,
        location: stall.stall_location,
        rentalPrice: stall.rental_price,
        branchName: stall.branch_name,
        floorName: stall.floor_name,
        sectionName: stall.section_name,
        auctionStatus: stall.raffle_auction_status,
        deadline: stall.raffle_auction_deadline
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
    console.error('âŒ Error getting auction participants:', error);
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
