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
      `SELECT application_id, branch_id FROM application WHERE applicant_id = ? AND stall_id = ? LIMIT 1`,
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

    // Update raffle status to 'Drawn'
    await connection.execute(
      `UPDATE raffle SET status = 'Drawn' WHERE raffle_id = ?`,
      [raffleId]
    );

    // Update winner participant status
    await connection.execute(
      `UPDATE raffle_participants SET status = 'Winner' WHERE participant_id = ?`,
      [winner.participant_id]
    );

    // Mark non-winners
    await connection.execute(
      `UPDATE raffle_participants SET status = 'Not Selected' WHERE raffle_id = ? AND participant_id != ?`,
      [raffleId, winner.participant_id]
    );

    // Update stall: raffle_auction_status, status to Occupied, is_available to 0
    await connection.execute(
      `UPDATE stall SET raffle_auction_status = 'Drawn', status = 'Occupied', is_available = 0 WHERE stall_id = ?`,
      [raffle.stall_id]
    );

    // Create stallholder record so stall appears in Owned Stalls
    if (applicantDetails.length) {
      const app = applicantDetails[0];
      // Check if stallholder already exists for this applicant+stall
      const [existingSH] = await connection.execute(
        `SELECT stallholder_id FROM stallholder WHERE applicant_id = ? AND stall_id = ?`,
        [app.applicant_id, raffle.stall_id]
      );
      if (existingSH.length === 0) {
        await connection.execute(
          `INSERT INTO stallholder (applicant_id, mobile_user_id, full_name, email, contact_number, address, stall_id, branch_id, payment_status, status, compliance_status, move_in_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'active', 'Compliant', CURDATE())`,
          [app.applicant_id, app.applicant_id, app.applicant_full_name, app.email_address, app.applicant_contact_number, app.applicant_address, raffle.stall_id, branchId]
        );
      }
    }

    // Update applicant status to approved
    await connection.execute(
      `UPDATE applicant SET status = 'approved' WHERE applicant_id = ?`,
      [winner.applicant_id]
    );

    // Create raffle result record
    await connection.execute(
      `INSERT INTO raffle_result (raffle_id, winner_participant_id, draw_date)
       VALUES (?, ?, NOW())`,
      [raffleId, winner.participant_id]
    );

    // Update application status to approved (if application exists)
    if (applicationId) {
      await connection.execute(
        `UPDATE application SET application_status = 'Approved', reviewed_by = ?, reviewed_at = NOW() WHERE application_id = ?`,
        [branchManagerId, applicationId]
      );
    }

    // Reject other pending applications for this stall
    await connection.execute(
      `UPDATE application SET application_status = 'Rejected', reviewed_by = ?, reviewed_at = NOW()
       WHERE stall_id = ? AND application_status IN ('Pending', 'Under Review') AND applicant_id != ?`,
      [branchManagerId, raffle.stall_id, winner.applicant_id]
    );

    // Log the winner selection
    await connection.execute(
      `INSERT INTO raffle_auction_log (event_type, event_id, action, performed_by, details)
       VALUES ('Raffle', ?, 'Winner Selected', ?, ?)`,
      [raffleId, branchManagerId, `Winner: ${winner.applicant_full_name} (ticket: ${winner.ticket_number || 'N/A'})`]
    );

    // After creating stallholder, check if winner now has 2 stalls — if so, auto-remove from all other auctions/raffles
    const [updatedStallCount] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM stallholder WHERE (applicant_id = ? OR mobile_user_id = ?) AND status = 'active'`,
      [winner.applicant_id, winner.applicant_id]
    );
    if (updatedStallCount[0].cnt >= 2) {
      // Remove from all other raffle_participants where still Registered
      await connection.execute(
        `UPDATE raffle_participants SET status = 'Removed', updated_at = NOW()
         WHERE applicant_id = ? AND status = 'Registered' AND raffle_id != ?`,
        [winner.applicant_id, raffleId]
      );
      // Remove from all other auction_participants where still Registered
      await connection.execute(
        `UPDATE auction_participants SET status = 'Removed', updated_at = NOW()
         WHERE applicant_id = ? AND status = 'Registered'`,
        [winner.applicant_id]
      );
      console.log(`🚫 Applicant ${winner.applicant_id} now has 2 stalls — removed from all other auctions/raffles`);
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

        // Update raffle status to 'Drawn'
        await connection.execute(
          `UPDATE raffle SET status = 'Drawn' WHERE raffle_id = ?`,
          [raffle.raffle_id]
        );

        // Update winner participant
        await connection.execute(
          `UPDATE raffle_participants SET status = 'Winner' WHERE participant_id = ?`,
          [winner.participant_id]
        );

        // Mark non-winners
        await connection.execute(
          `UPDATE raffle_participants SET status = 'Not Selected' WHERE raffle_id = ? AND participant_id != ?`,
          [raffle.raffle_id, winner.participant_id]
        );

        // Update stall: raffle_auction_status, status to Occupied, is_available to 0
        await connection.execute(
          `UPDATE stall SET raffle_auction_status = 'Drawn', status = 'Occupied', is_available = 0 WHERE stall_id = ?`,
          [raffle.stall_id]
        );

        // Create stallholder record so stall appears in Owned Stalls
        if (applicantDetails.length) {
          const app = applicantDetails[0];
          const [existingSH] = await connection.execute(
            `SELECT stallholder_id FROM stallholder WHERE applicant_id = ? AND stall_id = ?`,
            [app.applicant_id, raffle.stall_id]
          );
          if (existingSH.length === 0) {
            await connection.execute(
              `INSERT INTO stallholder (applicant_id, mobile_user_id, full_name, email, contact_number, address, stall_id, branch_id, payment_status, status, compliance_status, move_in_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'active', 'Compliant', CURDATE())`,
              [app.applicant_id, app.applicant_id, app.applicant_full_name, app.email_address, app.applicant_contact_number, app.applicant_address, raffle.stall_id, branchId]
            );
          }
        }

        // Update applicant status to approved
        await connection.execute(
          `UPDATE applicant SET status = 'approved' WHERE applicant_id = ?`,
          [winner.applicant_id]
        );

        // Create raffle result
        await connection.execute(
          `INSERT INTO raffle_result (raffle_id, winner_participant_id, draw_date)
           VALUES (?, ?, NOW())`,
          [raffle.raffle_id, winner.participant_id]
        );

        // Update application status
        if (applicationId) {
          await connection.execute(
            `UPDATE application SET application_status = 'Approved', reviewed_at = NOW() WHERE application_id = ?`,
            [applicationId]
          );
        }

        // Reject other pending applications for this stall
        await connection.execute(
          `UPDATE application SET application_status = 'Rejected', reviewed_at = NOW()
           WHERE stall_id = ? AND application_status IN ('Pending', 'Under Review') AND applicant_id != ?`,
          [raffle.stall_id, winner.applicant_id]
        );

        // After creating stallholder, auto-remove from other auctions/raffles if at 2 stalls
        const [updatedCnt] = await connection.execute(
          `SELECT COUNT(*) as cnt FROM stallholder WHERE (applicant_id = ? OR mobile_user_id = ?) AND status = 'active'`,
          [winner.applicant_id, winner.applicant_id]
        );
        if (updatedCnt[0].cnt >= 2) {
          await connection.execute(
            `UPDATE raffle_participants SET status = 'Removed' WHERE applicant_id = ? AND status = 'Registered' AND raffle_id != ?`,
            [winner.applicant_id, raffle.raffle_id]
          );
          await connection.execute(
            `UPDATE auction_participants SET status = 'Removed' WHERE applicant_id = ? AND status = 'Registered'`,
            [winner.applicant_id]
          );
          console.log(`🚫 Auto-removed applicant ${winner.applicant_id} from other auctions/raffles (has 2 stalls)`);
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

