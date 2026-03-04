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

    // Call stored procedure to finalize auction winner — handles all DB operations atomically
    const app = applicantDetails.length > 0 ? applicantDetails[0] : {};
    const [spResult] = await connection.execute(
      `CALL sp_finalize_auction_winner(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auctionId,
        winner.applicant_id,
        winnerBidId,
        auction.stall_id,
        branchId,
        branchManagerId,
        winner.bid_amount || auction.rental_price,
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

        // Check GLOBAL 2-stall limit (across all branches and all stall types)
        const [existingStalls] = await connection.execute(
          `SELECT COUNT(*) as stall_count FROM stallholder 
           WHERE (applicant_id = ? OR mobile_user_id = ?) AND status = 'active'`,
          [winner.applicant_id, winner.applicant_id]
        );
        if (existingStalls[0].stall_count >= 2) {
          console.log(`\u26a0\ufe0f Skipping auction ${auction.auction_id} - applicant already has 2 stalls globally`);
          results.push({
            auctionId: auction.auction_id,
            stallNumber: auction.stall_number,
            status: 'skipped_max_stalls',
            message: 'Winner already has maximum 2 stalls'
          });
          continue;
        }

        // Use stored procedure to finalize auction winner — handles all DB operations atomically
        const app = applicantDetails.length > 0 ? applicantDetails[0] : {};
        const [spResult] = await connection.execute(
          `CALL sp_finalize_auction_winner(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            auction.auction_id,
            winner.applicant_id,
            winner.bid_id,
            auction.stall_id,
            branchId,
            auction.created_by,
            winner.bid_amount,
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

