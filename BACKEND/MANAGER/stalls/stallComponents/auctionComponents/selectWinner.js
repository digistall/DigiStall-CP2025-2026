import { createConnection } from '../../../../../config/database.js'

// Select winner for auction (manual confirmation or auto when timer expires)
export const selectAuctionWinner = async (req, res) => {
  let connection;
  try {
    const { auctionId } = req.params;
    const { participantId, applicantId } = req.body; // Optional: for manual winner selection
    const branchManagerId = req.user?.branchManagerId || req.user?.userId;

    if (!branchManagerId) {
      return res.status(400).json({
        success: false,
        message: 'Branch manager ID not found in authentication token'
      });
    }

    console.log(`🎯 Confirming auction winner for auction ${auctionId}`);

    connection = await createConnection();

    // Get auction info and verify ownership
    const [auctionInfo] = await connection.execute(
      `SELECT a.auction_id, a.stall_id, a.status, a.created_by,
              s.stall_number, s.rental_price,
              (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.auction_id) AS total_bids
       FROM auction a
       INNER JOIN stall s ON a.stall_id = s.stall_id
       WHERE a.auction_id = ?`,
      [auctionId]
    );

    if (!auctionInfo.length) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    const auction = auctionInfo[0];

    // Only the branch manager who created the auction can confirm winner
    if (auction.created_by !== branchManagerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the branch manager who created this auction can confirm winner'
      });
    }

    // Check if winner already confirmed (auction_participants with status = 'Winner')
    const [existingWinner] = await connection.execute(
      `SELECT participant_id FROM auction_participants WHERE auction_id = ? AND status = 'Winner' LIMIT 1`,
      [auctionId]
    );
    if (existingWinner.length || auction.status === 'Awarded') {
      return res.status(400).json({
        success: false,
        message: 'Winner has already been confirmed for this auction'
      });
    }

    // Check if there are bids
    if (auction.total_bids === 0 && !participantId && !applicantId) {
      return res.status(400).json({
        success: false,
        message: 'No bids placed in this auction'
      });
    }

    let winner;
    let winnerBidId = null;

    // Manual selection by participantId or applicantId
    if (participantId || applicantId) {
      let manualQuery, manualParams;
      if (participantId) {
        manualQuery = `SELECT ap.participant_id, ap.applicant_id,
                              app.applicant_full_name, app.applicant_contact_number,
                              (SELECT ab.bid_id FROM auction_bids ab WHERE ab.auction_id = ? AND ab.applicant_id = ap.applicant_id ORDER BY ab.bid_amount DESC LIMIT 1) AS bid_id,
                              (SELECT ab.bid_amount FROM auction_bids ab WHERE ab.auction_id = ? AND ab.applicant_id = ap.applicant_id ORDER BY ab.bid_amount DESC LIMIT 1) AS bid_amount
                       FROM auction_participants ap
                       INNER JOIN applicant app ON ap.applicant_id = app.applicant_id
                       WHERE ap.auction_id = ? AND ap.participant_id = ?`;
        manualParams = [auctionId, auctionId, auctionId, participantId];
      } else {
        manualQuery = `SELECT ap.participant_id, ap.applicant_id,
                              app.applicant_full_name, app.applicant_contact_number,
                              (SELECT ab.bid_id FROM auction_bids ab WHERE ab.auction_id = ? AND ab.applicant_id = ap.applicant_id ORDER BY ab.bid_amount DESC LIMIT 1) AS bid_id,
                              (SELECT ab.bid_amount FROM auction_bids ab WHERE ab.auction_id = ? AND ab.applicant_id = ap.applicant_id ORDER BY ab.bid_amount DESC LIMIT 1) AS bid_amount
                       FROM auction_participants ap
                       INNER JOIN applicant app ON ap.applicant_id = app.applicant_id
                       WHERE ap.auction_id = ? AND ap.applicant_id = ?`;
        manualParams = [auctionId, auctionId, auctionId, applicantId];
      }

      const [manualWinner] = await connection.execute(manualQuery, manualParams);

      if (!manualWinner.length) {
        return res.status(400).json({
          success: false,
          message: 'Selected participant not found in this auction'
        });
      }

      winner = manualWinner[0];
      winnerBidId = winner.bid_id || null;
      console.log(`👑 Manually selected winner: ${winner.applicant_full_name}`);
    } else {
      // Auto-selection: Get winner info (highest bidder)
      const [winnerInfo] = await connection.execute(
        `SELECT ab.bid_id, ab.applicant_id, ab.bid_amount,
                app.applicant_full_name, app.applicant_contact_number
         FROM auction_bids ab
         INNER JOIN applicant app ON ab.applicant_id = app.applicant_id
         WHERE ab.auction_id = ? AND ab.status != 'Cancelled'
         ORDER BY ab.bid_amount DESC
         LIMIT 1`,
        [auctionId]
      );

      if (!winnerInfo.length) {
        return res.status(400).json({
          success: false,
          message: 'No valid bids found'
        });
      }

      winner = winnerInfo[0];
      winnerBidId = winner.bid_id;
      console.log(`👑 Auto-selected highest bidder: ${winner.applicant_full_name} with bid ₱${winner.bid_amount}`);
    }

    // Look up the application for this winner + stall
    const [appInfo] = await connection.execute(
      `SELECT application_id, branch_id FROM application WHERE applicant_id = ? AND stall_id = ? LIMIT 1`,
      [winner.applicant_id, auction.stall_id]
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
      [auction.stall_id]
    );
    const branchId = stallBranch.length ? stallBranch[0].branch_id : null;

    // Check 2-stall-per-branch limit
    if (branchId) {
      const [existingStalls] = await connection.execute(
        `SELECT COUNT(*) as stall_count FROM stallholder 
         WHERE (applicant_id = ? OR mobile_user_id = ?) AND branch_id = ? AND status = 'active'`,
        [winner.applicant_id, winner.applicant_id, branchId]
      );
      if (existingStalls[0].stall_count >= 2) {
        return res.status(400).json({
          success: false,
          message: 'This applicant already has the maximum of 2 stalls in this branch'
        });
      }
    }

    // Begin transaction to prevent partial commits (use query() not execute() for transaction commands)
    await connection.query('START TRANSACTION');

    // Update auction status to 'Awarded'
    await connection.execute(
      `UPDATE auction SET status = 'Awarded' WHERE auction_id = ?`,
      [auctionId]
    );

    // Mark winning bid (if a bid exists)
    if (winnerBidId) {
      await connection.execute(
        `UPDATE auction_bids SET status = 'Winning' WHERE bid_id = ?`,
        [winnerBidId]
      );
    }

    // Mark winner in auction_participants
    await connection.execute(
      `UPDATE auction_participants SET status = 'Winner' WHERE auction_id = ? AND applicant_id = ?`,
      [auctionId, winner.applicant_id]
    );

    // Mark non-winners
    await connection.execute(
      `UPDATE auction_participants SET status = 'Not Selected' WHERE auction_id = ? AND applicant_id != ?`,
      [auctionId, winner.applicant_id]
    );

    // Update stall: mark as Occupied, not available, set raffle_auction_status
    await connection.execute(
      `UPDATE stall SET raffle_auction_status = 'Awarded', status = 'Occupied', is_available = 0, updated_at = NOW() WHERE stall_id = ?`,
      [auction.stall_id]
    );

    // Create auction result record
    await connection.execute(
      `INSERT INTO auction_result (auction_id, winner_bid_id, final_amount, awarded_date)
       VALUES (?, ?, ?, NOW())`,
      [auctionId, winnerBidId, winner.bid_amount || auction.rental_price]
    );

    // Update application status to approved (if application exists)
    if (applicationId) {
      await connection.execute(
        `UPDATE application SET application_status = 'Approved', reviewed_by = ?, reviewed_at = NOW() WHERE application_id = ?`,
        [branchManagerId, applicationId]
      );
    }

    // Create stallholder record so the winner sees this stall in Owned Stalls
    if (applicantDetails.length > 0) {
      const app = applicantDetails[0];
      const [existingStallholder] = await connection.execute(
        `SELECT stallholder_id FROM stallholder WHERE applicant_id = ? AND stall_id = ?`,
        [winner.applicant_id, auction.stall_id]
      );

      let stallholderId;
      if (existingStallholder.length === 0) {
        const [shResult] = await connection.execute(
          `INSERT INTO stallholder (
            applicant_id, mobile_user_id, full_name, email, contact_number, address,
            stall_id, branch_id, payment_status, status, compliance_status, move_in_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'active', 'Compliant', CURDATE())`,
          [
            app.applicant_id, app.applicant_id,
            app.applicant_full_name, app.email_address,
            app.applicant_contact_number, app.applicant_address,
            auction.stall_id, branchId
          ]
        );
        stallholderId = shResult.insertId;
        console.log(`🏪 Created stallholder record ${stallholderId} for auction winner`);
      } else {
        stallholderId = existingStallholder[0].stallholder_id;
        console.log(`🏪 Stallholder record ${stallholderId} already exists for this stall`);
      }

      // Update applicant status to approved
      await connection.execute(
        `UPDATE applicant SET status = 'approved', updated_at = NOW() WHERE applicant_id = ?`,
        [winner.applicant_id]
      );
    }

    // Reject other pending applications for the same stall
    await connection.execute(
      `UPDATE application SET application_status = 'Rejected', updated_at = NOW()
       WHERE stall_id = ? AND application_status IN ('Pending', 'Under Review')${applicationId ? ' AND application_id != ?' : ''}`,
      applicationId ? [auction.stall_id, applicationId] : [auction.stall_id]
    );

    // Log the winner confirmation
    await connection.execute(
      `INSERT INTO raffle_auction_log (event_type, event_id, action, performed_by, details)
       VALUES ('Auction', ?, 'Winner Selected', ?, ?)`,
      [auctionId, branchManagerId, `Winner: ${winner.applicant_full_name} with bid ₱${winner.bid_amount}`]
    );

    // Commit transaction
    await connection.query('COMMIT');

    // Count distinct bidders
    const [bidCount] = await connection.execute(
      'SELECT COUNT(DISTINCT applicant_id) as bidders FROM auction_bids WHERE auction_id = ?',
      [auctionId]
    );

    console.log(`✅ Winner confirmed for auction ${auctionId}: ${winner.applicant_full_name} with bid ₱${winner.bid_amount || 'N/A'}`);

    res.json({
      success: true,
      message: `Winner confirmed! ${winner.applicant_full_name} won stall ${auction.stall_number}${winner.bid_amount ? ' with bid ₱' + winner.bid_amount : ''}`,
      data: {
        auctionId: auctionId,
        stallNumber: auction.stall_number,
        winner: {
          applicantId: winner.applicant_id,
          name: winner.applicant_full_name,
          contact: winner.applicant_contact_number,
          applicationId: applicationId,
          winningBid: winner.bid_amount ? parseFloat(winner.bid_amount) : null
        },
        totalBids: auction.total_bids,
        totalBidders: bidCount[0].bidders,
        rentalPrice: auction.rental_price
      }
    });

  } catch (error) {
    if (connection) {
      try { await connection.query('ROLLBACK'); } catch (e) { /* ignore rollback error */ }
    }
    console.error('❌ Select auction winner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select auction winner',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Auto-select winner for expired auctions (can be called by cron job)
export const autoSelectWinnerForExpiredAuctions = async (req, res) => {
  let connection;
  try {
    console.log('🔄 Checking for expired auctions...');

    connection = await createConnection();

    // Find all expired auctions that haven't confirmed winners yet
    // status = 'Open' and end_date has passed
    const [expiredAuctions] = await connection.execute(
      `SELECT a.auction_id, a.stall_id, a.created_by, s.stall_number,
              (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.auction_id) AS total_bids
       FROM auction a
       INNER JOIN stall s ON a.stall_id = s.stall_id
       WHERE a.status = 'Open'
       AND a.end_date <= NOW()
       AND NOT EXISTS (
         SELECT 1 FROM auction_participants ap WHERE ap.auction_id = a.auction_id AND ap.status = 'Winner'
       )`
    );

    console.log(`Found ${expiredAuctions.length} expired auctions`);

    const results = [];

    for (const auction of expiredAuctions) {
      try {
        if (auction.total_bids === 0) {
          // No bids - just close the auction
          await connection.execute(
            `UPDATE auction SET status = 'Closed' WHERE auction_id = ?`,
            [auction.auction_id]
          );
          await connection.execute(
            `UPDATE stall SET raffle_auction_status = 'Closed' WHERE stall_id = ?`,
            [auction.stall_id]
          );

          results.push({
            auctionId: auction.auction_id,
            stallNumber: auction.stall_number,
            status: 'ended_no_bids'
          });

          console.log(`📝 Auction ${auction.auction_id} closed - no bids`);
          continue;
        }

        // Get highest bidder (winner)
        const [winnerInfo] = await connection.execute(
          `SELECT ab.bid_id, ab.applicant_id, ab.bid_amount,
                  app.applicant_full_name
           FROM auction_bids ab
           INNER JOIN applicant app ON ab.applicant_id = app.applicant_id
           WHERE ab.auction_id = ? AND ab.status != 'Cancelled'
           ORDER BY ab.bid_amount DESC
           LIMIT 1`,
          [auction.auction_id]
        );

        if (winnerInfo.length === 0) {
          console.error(`❌ No valid bids found for auction ${auction.auction_id}`);
          continue;
        }

        const winner = winnerInfo[0];

        // Look up application
        const [appInfo] = await connection.execute(
          `SELECT application_id FROM application WHERE applicant_id = ? AND stall_id = ? LIMIT 1`,
          [winner.applicant_id, auction.stall_id]
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
          [auction.stall_id]
        );
        const branchId = stallBranch.length ? stallBranch[0].branch_id : null;

        // Check 2-stall-per-branch limit
        if (branchId) {
          const [existingStalls] = await connection.execute(
            `SELECT COUNT(*) as stall_count FROM stallholder 
             WHERE (applicant_id = ? OR mobile_user_id = ?) AND branch_id = ? AND status = 'active'`,
            [winner.applicant_id, winner.applicant_id, branchId]
          );
          if (existingStalls[0].stall_count >= 2) {
            console.log(`⚠️ Skipping auction ${auction.auction_id} - applicant already has 2 stalls in branch`);
            results.push({
              auctionId: auction.auction_id,
              stallNumber: auction.stall_number,
              status: 'skipped_max_stalls',
              message: 'Winner already has maximum 2 stalls in this branch'
            });
            continue;
          }
        }

        // Update auction status to 'Awarded'
        await connection.execute(
          `UPDATE auction SET status = 'Awarded' WHERE auction_id = ?`,
          [auction.auction_id]
        );

        // Mark winning bid
        await connection.execute(
          `UPDATE auction_bids SET status = 'Winning' WHERE bid_id = ?`,
          [winner.bid_id]
        );

        // Mark winner in auction_participants
        await connection.execute(
          `UPDATE auction_participants SET status = 'Winner' WHERE auction_id = ? AND applicant_id = ?`,
          [auction.auction_id, winner.applicant_id]
        );

        // Mark non-winners
        await connection.execute(
          `UPDATE auction_participants SET status = 'Not Selected' WHERE auction_id = ? AND applicant_id != ?`,
          [auction.auction_id, winner.applicant_id]
        );

        // Update stall: raffle_auction_status, status to Occupied, is_available to 0
        await connection.execute(
          `UPDATE stall SET raffle_auction_status = 'Awarded', status = 'Occupied', is_available = 0 WHERE stall_id = ?`,
          [auction.stall_id]
        );

        // Create stallholder record so stall appears in Owned Stalls
        if (applicantDetails.length) {
          const app = applicantDetails[0];
          const [existingSH] = await connection.execute(
            `SELECT stallholder_id FROM stallholder WHERE applicant_id = ? AND stall_id = ?`,
            [app.applicant_id, auction.stall_id]
          );
          if (existingSH.length === 0) {
            await connection.execute(
              `INSERT INTO stallholder (applicant_id, mobile_user_id, full_name, email, contact_number, address, stall_id, branch_id, payment_status, status, compliance_status, move_in_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'active', 'Compliant', CURDATE())`,
              [app.applicant_id, app.applicant_id, app.applicant_full_name, app.email_address, app.applicant_contact_number, app.applicant_address, auction.stall_id, branchId]
            );
          }
        }

        // Update applicant status to approved
        await connection.execute(
          `UPDATE applicant SET status = 'approved' WHERE applicant_id = ?`,
          [winner.applicant_id]
        );

        // Create auction result
        await connection.execute(
          `INSERT INTO auction_result (auction_id, winner_bid_id, final_amount, awarded_date)
           VALUES (?, ?, ?, NOW())`,
          [auction.auction_id, winner.bid_id, winner.bid_amount]
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
          [auction.stall_id, winner.applicant_id]
        );

        // Count bidders
        const [bidCount] = await connection.execute(
          'SELECT COUNT(DISTINCT applicant_id) as bidders FROM auction_bids WHERE auction_id = ?',
          [auction.auction_id]
        );

        results.push({
          auctionId: auction.auction_id,
          stallNumber: auction.stall_number,
          winner: winner.applicant_full_name,
          winningBid: parseFloat(winner.bid_amount),
          totalBids: auction.total_bids,
          totalBidders: bidCount[0].bidders,
          status: 'winner_selected'
        });

        console.log(`👑 Auto-confirmed winner for auction ${auction.auction_id}: ${winner.applicant_full_name} (₱${winner.bid_amount})`);

      } catch (error) {
        console.error(`❌ Error processing auction ${auction.auction_id}:`, error);
        results.push({
          auctionId: auction.auction_id,
          stallNumber: auction.stall_number,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${expiredAuctions.length} expired auctions`,
      data: results
    });

  } catch (error) {
    console.error('❌ Auto select winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-select winners for expired auctions',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

