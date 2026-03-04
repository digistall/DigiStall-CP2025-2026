import { createConnection } from '../../../../../config/database.js';
import { decryptData } from '../../../../../services/encryptionService.js';

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
        r.raffle_name,
        r.status as raffle_status,
        r.start_date,
        r.end_date,
        r.draw_date,
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
          rp.stallholder_id,
          rp.ticket_number,
          rp.registration_date,
          rp.status as participant_status
        FROM raffle_participants rp
        WHERE rp.raffle_id = ?
        ORDER BY rp.registration_date ASC`,
        [raffleData.raffle_id]
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
              
              // Try to fetch email from multiple sources
              let applicantEmail = 'N/A';
              
              // 1. Try stallholder table by applicant_id
              const [stallholderByApplicant] = await connection.execute(
                `SELECT email, full_name FROM stallholder WHERE applicant_id = ? LIMIT 1`,
                [p.applicant_id]
              );
              if (stallholderByApplicant.length > 0 && stallholderByApplicant[0].email) {
                applicantEmail = decryptData(stallholderByApplicant[0].email) || 'N/A';
                console.log('Found email from stallholder table by applicant_id:', applicantEmail);
              }
              
              // 2. Try credential.username (often stores email)
              if (applicantEmail === 'N/A') {
                const [credentialResult] = await connection.execute(
                  `SELECT username FROM credential WHERE applicant_id = ? LIMIT 1`,
                  [p.applicant_id]
                );
                if (credentialResult.length > 0 && credentialResult[0].username) {
                  const username = credentialResult[0].username;
                  // Check if username looks like an email
                  if (username.includes('@')) {
                    applicantEmail = username;
                    console.log('Found email from credential.username:', applicantEmail);
                  }
                }
              }
              
              // 3. Try other_information.email_address (encrypted)
              if (applicantEmail === 'N/A') {
                const [otherInfoResult] = await connection.execute(
                  `SELECT email_address FROM other_information WHERE applicant_id = ? LIMIT 1`,
                  [p.applicant_id]
                );
                if (otherInfoResult.length > 0 && otherInfoResult[0].email_address) {
                  applicantEmail = decryptData(otherInfoResult[0].email_address) || 'N/A';
                  console.log('Found email from other_information:', applicantEmail);
                }
              }
              
              if (applicantDetails.length > 0) {
                const app = applicantDetails[0];
                const decryptedFullName = decryptData(app.applicant_full_name) || 'Unknown';
                
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
            console.error(`❌ Error fetching details for participant ${p.participant_id}:`, err);
            console.error('Error stack:', err.stack);
          }

          // Get stall count for this participant (how many active stalls they already own)
          let stallCount = 0;
          try {
            const lookupId = p.applicant_id || p.stallholder_id;
            if (lookupId) {
              const [stallCountResult] = await connection.execute(
                `SELECT COUNT(*) as stall_count FROM stallholder 
                 WHERE (applicant_id = ? OR mobile_user_id = ?) AND status = 'active'`,
                [lookupId, lookupId]
              );
              stallCount = stallCountResult[0]?.stall_count || 0;
            }
          } catch (countErr) {
            console.error(`Error getting stall count for participant ${p.participant_id}:`, countErr);
          }

          // Dynamically update businessName based on current stall count
          // (fixes badge when participant became stallholder after joining)
          if (stallCount > 0 && personalInfo.businessName !== 'Stallholder') {
            personalInfo.businessName = 'Stallholder';
          }

          return {
            participantId: p.participant_id,
            applicantId: p.applicant_id,
            stallholderId: p.stallholder_id,
            ticketNumber: p.ticket_number,
            participantNumber: index + 1,
            isWinner: p.participant_status === 'Winner',
            isStallholder: !!p.stallholder_id,
            joinedAt: p.registration_date,
            status: p.participant_status,
            stallCount,
            personalInfo
          };
        })
      );

      participants = participantsWithDetails;
    }

    console.log(`✅ Found ${participants.length} raffle participants for stall ${stall.stall_number}`);

    res.json({
      success: true,
      message: 'Raffle participants retrieved successfully',
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
        raffleStatus: stall.raffle_auction_status,
        deadline: stall.raffle_auction_deadline
      },
      raffleInfo: raffleData ? {
        raffleId: raffleData.raffle_id,
        raffleName: raffleData.raffle_name,
        status: raffleData.raffle_status,
        startDate: raffleData.start_date,
        endDate: raffleData.end_date,
        drawDate: raffleData.draw_date,
        createdAt: raffleData.created_at,
        totalParticipants: participants.length,
        endTime: raffleData.end_date  // Add endTime for the modal
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

