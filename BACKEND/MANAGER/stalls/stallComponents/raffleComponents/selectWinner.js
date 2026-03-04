import { createConnection } from '../../../../../config/database.js'

// Select winner for raffle (manual selection or auto when timer expires)
export const selectRaffleWinner = async (req, res) => {
  let connection;
  try {
    const { raffleId } = req.params;
    const { method = 'random', participantId } = req.body; // 'random' or 'manual', participantId for manual selection
    const branchManagerId = req.user?.branchManagerId || req.user?.userId;

    if (!branchManagerId) {
      return res.status(400).json({
        success: false,
        message: 'Branch manager ID not found in authentication token'
      });
    }

    console.log(`🎯 Selecting winner for raffle ${raffleId} using ${method} method`);

    connection = await createConnection();

    // Get raffle info and verify ownership
    const [raffleInfo] = await connection.execute(
      `SELECT r.raffle_id, r.stall_id, r.status, r.created_by,
              s.stall_number, s.rental_price,
              (SELECT COUNT(*) FROM raffle_participants WHERE raffle_id = r.raffle_id) AS total_participants
       FROM raffle r
       INNER JOIN stall s ON r.stall_id = s.stall_id
       WHERE r.raffle_id = ?`,
      [raffleId]
    );

    if (!raffleInfo.length) {
      return res.status(404).json({
        success: false,
        message: 'Raffle not found'
      });
    }

    const raffle = raffleInfo[0];

    // Only the branch manager who created the raffle can select winner
    if (raffle.created_by !== branchManagerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the branch manager who created this raffle can select winner'
      });
    }

    // Check if winner already selected
    const [existingWinner] = await connection.execute(
      `SELECT participant_id FROM raffle_participants WHERE raffle_id = ? AND status = 'Winner' LIMIT 1`,
      [raffleId]
    );
    if (existingWinner.length || raffle.status === 'Drawn') {
      return res.status(400).json({
        success: false,
        message: 'Winner has already been selected for this raffle'
      });
    }

    // Check if there are participants
    if (raffle.total_participants === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants in this raffle'
      });
    }

    // Get all registered participants
    const [participants] = await connection.execute(
      `SELECT rp.participant_id, rp.applicant_id, rp.ticket_number,
              app.applicant_full_name, app.applicant_contact_number
       FROM raffle_participants rp
       INNER JOIN applicant app ON rp.applicant_id = app.applicant_id
       WHERE rp.raffle_id = ? AND rp.status = 'Registered'`,
      [raffleId]
    );

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No registered participants found'
      });
    }

    let winner;

    if (method === 'manual' && participantId) {
      // Manual selection - find the specific participant
      const manualWinner = participants.find(p => p.participant_id == participantId);
      if (!manualWinner) {
        return res.status(400).json({
          success: false,
          message: 'Selected participant not found among registered participants'
        });
      }
      winner = manualWinner;
      console.log(`👑 Manually selected winner: ${winner.applicant_full_name}`);
    } else if (participants.length === 1) {
      // Automatic winner if only one participant
      winner = participants[0];
      console.log(`👑 Automatic winner (only participant): ${winner.applicant_full_name}`);
    } else {
      // Random selection
      const randomIndex = Math.floor(Math.random() * participants.length);
      winner = participants[randomIndex];
      console.log(`👑 Random winner selected: ${winner.applicant_full_name} (${randomIndex + 1}/${participants.length})`);
    }

    // Look up the application for this winner + stall
    const [appInfo] = await connection.execute(
      `SELECT application_id FROM application WHERE applicant_id = ? AND stall_id = ? LIMIT 1`,
      [winner.applicant_id, raffle.stall_id]
    );
    const applicationId = appInfo.length ? appInfo[0].application_id : null;

    // Get applicant details for stallholder creation (email is in other_information table)
    const [applicantDetails] = await connection.execute(
      `SELECT a.applicant_id, a.applicant_full_name, oi.email_address, a.applicant_contact_number, a.applicant_address
       FROM applicant a
       LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
       WHERE a.applicant_id = ?`,
      [winner.applicant_id]
    );

    // Get branch_id from stall
    const [stallBranch] = await connection.execute(
      `SELECT branch_id FROM stall WHERE stall_id = ?`,
      [raffle.stall_id]
    );
    const branchId = stallBranch.length ? stallBranch[0].branch_id : null;

    // Check GLOBAL 2-stall limit (across all branches and all stall types)
    const [existingStalls] = await connection.execute(
      `SELECT sh.stallholder_id, sh.stall_id, s.stall_number, s.price_type, b.branch_name
       FROM stallholder sh
       JOIN stall s ON sh.stall_id = s.stall_id
       LEFT JOIN branch b ON sh.branch_id = b.branch_id
       WHERE (sh.applicant_id = ? OR sh.mobile_user_id = ?) AND sh.status = 'active'`,
      [winner.applicant_id, winner.applicant_id]
    );
    if (existingStalls.length >= 2) {
      return res.status(400).json({
        success: false,
        message: `This applicant already owns ${existingStalls.length} stall(s) (maximum is 2). Cannot assign more stalls.`,
        maxStalls: true,
        existingStalls: existingStalls.map(s => ({
          stallNumber: s.stall_number,
          type: s.price_type,
          branch: s.branch_name
        }))
      });
    }

    // Begin transaction (use query() not execute() for transaction commands)
    await connection.query('START TRANSACTION');

    // Call stored procedure to finalize raffle winner — handles all DB operations atomically
    const app = applicantDetails.length > 0 ? applicantDetails[0] : {};
    const [spResult] = await connection.execute(
      `CALL sp_finalize_raffle_winner(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        raffleId,
        winner.participant_id,
        winner.applicant_id,
        raffle.stall_id,
        branchId,
        branchManagerId,
        winner.ticket_number || null,
        app.applicant_full_name || '',
        app.email_address || '',
        app.applicant_contact_number || '',
        app.applicant_address || '',
        applicationId
      ]
    );

    // Check if auto-removed from other auctions/raffles
    const resultSet = Array.isArray(spResult) ? spResult[0] : spResult;
    if (resultSet && resultSet[0] && resultSet[0].new_stall_count >= 2) {
      console.log(`🚫 Applicant ${winner.applicant_id} now has ${resultSet[0].new_stall_count} stalls — auto-removed from other auctions/raffles`);
    }

    // Commit transaction
    await connection.query('COMMIT');

    console.log(`✅ Winner selected and raffle completed for stall ${raffle.stall_number}`);

    res.json({
      success: true,
      message: `Winner selected! ${winner.applicant_full_name} won stall ${raffle.stall_number}`,
      data: {
        raffleId: raffleId,
        stallNumber: raffle.stall_number,
        winner: {
          applicantId: winner.applicant_id,
          name: winner.applicant_full_name,
          contact: winner.applicant_contact_number,
          applicationId: applicationId,
          ticketNumber: winner.ticket_number
        },
        totalParticipants: raffle.total_participants,
        selectionMethod: method,
        rentalPrice: raffle.rental_price
      }
    });

  } catch (error) {
    if (connection) {
      try { await connection.query('ROLLBACK'); } catch (e) { /* ignore rollback error */ }
    }
    console.error('❌ Select raffle winner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select raffle winner',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Auto-select winner when timer expires (can be called by cron job)
export const autoSelectWinnerForExpiredRaffles = async (req, res) => {
  let connection;
  try {
    console.log('🔄 Checking for expired raffles...');

    connection = await createConnection();

    // Find all expired raffles that haven't selected winners yet
    // status = 'Open' and end_date has passed
    const [expiredRaffles] = await connection.execute(
      `SELECT r.raffle_id, r.stall_id, r.created_by, s.stall_number,
              (SELECT COUNT(*) FROM raffle_participants WHERE raffle_id = r.raffle_id) AS total_participants
       FROM raffle r
       INNER JOIN stall s ON r.stall_id = s.stall_id
       WHERE r.status = 'Open'
       AND r.end_date <= NOW()
       AND NOT EXISTS (
         SELECT 1 FROM raffle_participants rp WHERE rp.raffle_id = r.raffle_id AND rp.status = 'Winner'
       )`
    );

    console.log(`Found ${expiredRaffles.length} expired raffles`);

    const results = [];

    for (const raffle of expiredRaffles) {
      try {
        if (raffle.total_participants === 0) {
          // No participants - just close the raffle
          await connection.execute(
            `UPDATE raffle SET status = 'Closed' WHERE raffle_id = ?`,
            [raffle.raffle_id]
          );
          await connection.execute(
            `UPDATE stall SET raffle_auction_status = 'Closed' WHERE stall_id = ?`,
            [raffle.stall_id]
          );

          results.push({
            raffleId: raffle.raffle_id,
            stallNumber: raffle.stall_number,
            status: 'ended_no_participants'
          });

          console.log(`📝 Raffle ${raffle.raffle_id} closed - no participants`);
          continue;
        }

        // Get registered participants for this raffle
        const [participants] = await connection.execute(
          `SELECT rp.participant_id, rp.applicant_id, rp.ticket_number,
                  app.applicant_full_name
           FROM raffle_participants rp
           INNER JOIN applicant app ON rp.applicant_id = app.applicant_id
           WHERE rp.raffle_id = ? AND rp.status = 'Registered'`,
          [raffle.raffle_id]
        );

        if (participants.length === 0) {
          console.error(`❌ No registered participants for raffle ${raffle.raffle_id}`);
          continue;
        }

        let winner;
        if (participants.length === 1) {
          winner = participants[0];
        } else {
          const randomIndex = Math.floor(Math.random() * participants.length);
          winner = participants[randomIndex];
        }

        // Look up application
        const [appInfo] = await connection.execute(
          `SELECT application_id FROM application WHERE applicant_id = ? AND stall_id = ? LIMIT 1`,
          [winner.applicant_id, raffle.stall_id]
        );
        const applicationId = appInfo.length ? appInfo[0].application_id : null;

        // Get applicant details for stallholder creation (email is in other_information table)
        const [applicantDetails] = await connection.execute(
          `SELECT a.applicant_id, a.applicant_full_name, oi.email_address, a.applicant_contact_number, a.applicant_address
           FROM applicant a
           LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
           WHERE a.applicant_id = ?`,
          [winner.applicant_id]
        );

        // Get branch_id from stall
        const [stallBranch] = await connection.execute(
          `SELECT branch_id FROM stall WHERE stall_id = ?`,
          [raffle.stall_id]
        );
        const branchId = stallBranch.length ? stallBranch[0].branch_id : null;

        // Check GLOBAL 2-stall limit (across all branches and all stall types)
        const [existingStalls] = await connection.execute(
          `SELECT COUNT(*) as stall_count FROM stallholder 
           WHERE (applicant_id = ? OR mobile_user_id = ?) AND status = 'active'`,
          [winner.applicant_id, winner.applicant_id]
        );
        if (existingStalls[0].stall_count >= 2) {
          console.log(`\u26a0\ufe0f Skipping raffle ${raffle.raffle_id} - applicant already has 2 stalls globally`);
          results.push({
            raffleId: raffle.raffle_id,
            stallNumber: raffle.stall_number,
            status: 'skipped_max_stalls',
            message: 'Winner already has maximum 2 stalls'
          });
          continue;
        }

        // Use stored procedure to finalize raffle winner — handles all DB operations atomically
        const app = applicantDetails.length > 0 ? applicantDetails[0] : {};
        const [spResult] = await connection.execute(
          `CALL sp_finalize_raffle_winner(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            raffle.raffle_id,
            winner.participant_id,
            winner.applicant_id,
            raffle.stall_id,
            branchId,
            raffle.created_by,
            winner.ticket_number || null,
            app.applicant_full_name || '',
            app.email_address || '',
            app.applicant_contact_number || '',
            app.applicant_address || '',
            applicationId
          ]
        );

        // Check if auto-removed from other auctions/raffles
        const resultSet = Array.isArray(spResult) ? spResult[0] : spResult;
        if (resultSet && resultSet[0] && resultSet[0].new_stall_count >= 2) {
          console.log(`🚫 Auto-removed applicant ${winner.applicant_id} from other auctions/raffles (has ${resultSet[0].new_stall_count} stalls)`);
        }

        results.push({
          raffleId: raffle.raffle_id,
          stallNumber: raffle.stall_number,
          winner: winner.applicant_full_name,
          totalParticipants: raffle.total_participants,
          status: 'winner_selected'
        });

        console.log(`👑 Auto-selected winner for raffle ${raffle.raffle_id}: ${winner.applicant_full_name}`);

      } catch (error) {
        console.error(`❌ Error processing raffle ${raffle.raffle_id}:`, error);
        results.push({
          raffleId: raffle.raffle_id,
          stallNumber: raffle.stall_number,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${expiredRaffles.length} expired raffles`,
      data: results
    });

  } catch (error) {
    console.error('❌ Auto select winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-select winners for expired raffles',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

