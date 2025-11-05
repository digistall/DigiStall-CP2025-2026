import { createConnection } from '../../../../config/database.js'

// Get all active auctions for a branch manager or employee
export const getActiveAuctions = async (req, res) => {
  let connection;
  try {
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log("🔍 getActiveAuctions - User details:", {
      userType,
      userId,
      branchId: req.user?.branchId,
      permissions: req.user?.permissions,
    });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in authentication token'
      });
    }

    connection = await createConnection();

    let auctions = [];

    // Handle different user types
    if (userType === "branch_manager" || userType === "branch-manager") {
      // Branch manager: Get all auctions in their branch
      const branchManagerId = req.user?.branchManagerId || userId;

      console.log(`Fetching auctions for branch manager ID: ${branchManagerId}`);

      const [result] = await connection.execute(
        `SELECT 
          s.stall_id,
          s.stall_no,
          s.stall_location,
          s.rental_price,
          s.price_type,
          s.is_available,
          s.created_at,
          s.raffle_auction_deadline,
          s.raffle_auction_status,
          s.raffle_auction_start_time,
          s.raffle_auction_end_time,
          b.branch_name,
          f.floor_name,
          f.floor_id,
          sec.section_name,
          sec.section_id
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        INNER JOIN branch_manager bm ON b.branch_id = bm.branch_id
        WHERE bm.branch_manager_id = ? AND s.price_type = 'Auction'
        ORDER BY s.created_at DESC`,
        [branchManagerId]
      );

      auctions = result;
    } else if (userType === "employee") {
      // Employee: Check permissions first
      const permissions = req.user?.permissions || [];

      let hasStallsPermission = false;
      if (Array.isArray(permissions)) {
        hasStallsPermission = permissions.includes("stalls");
      } else {
        hasStallsPermission = permissions.stalls || false;
      }

      console.log("� Employee permission check:", {
        permissions,
        isArray: Array.isArray(permissions),
        hasStallsPermission,
      });

      if (!hasStallsPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Employee does not have stalls permission.",
        });
      }

      // Get employee's branch ID
      const branchId = req.user?.branchId;

      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "Branch ID not found for employee",
        });
      }

      console.log(`Fetching auctions for employee in branch ID: ${branchId}`);

      // Get all auctions in the employee's branch
      const [result] = await connection.execute(
        `SELECT 
          s.stall_id,
          s.stall_no,
          s.stall_location,
          s.rental_price,
          s.price_type,
          s.is_available,
          s.created_at,
          s.raffle_auction_deadline,
          s.raffle_auction_status,
          s.raffle_auction_start_time,
          s.raffle_auction_end_time,
          b.branch_name,
          f.floor_name,
          f.floor_id,
          sec.section_name,
          sec.section_id
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE b.branch_id = ? AND s.price_type = 'Auction'
        ORDER BY s.created_at DESC`,
        [branchId]
      );

      auctions = result;
    } else if (userType === "admin") {
      // Admin: Get all auctions
      console.log("Fetching all auctions for admin");

      const [result] = await connection.execute(
        `SELECT 
          s.stall_id,
          s.stall_no,
          s.stall_location,
          s.rental_price,
          s.price_type,
          s.is_available,
          s.created_at,
          s.raffle_auction_deadline,
          s.raffle_auction_status,
          s.raffle_auction_start_time,
          s.raffle_auction_end_time,
          b.branch_name,
          f.floor_name,
          f.floor_id,
          sec.section_name,
          sec.section_id
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE s.price_type = 'Auction'
        ORDER BY s.created_at DESC`
      );

      auctions = result;
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid user type.",
      });
    }

    console.log(`📋 Found ${auctions.length} auction stalls for ${userType} ${userId}`);

    res.json({
      success: true,
      message: 'Auction stalls retrieved successfully',
      data: auctions,
      counts: {
        total: auctions.length,
        available: auctions.filter(a => a.raffle_auction_status === 'Not Started').length,
        active: auctions.filter(a => a.raffle_auction_status === 'Active').length,
        ended: auctions.filter(a => a.raffle_auction_status === 'Ended').length
      }
    });

  } catch (error) {
    console.error('❌ Get active auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve auctions',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get auction details including bid history
export const getAuctionDetails = async (req, res) => {
  let connection;
  try {
    const { auctionId } = req.params;
    const branchManagerId = req.user?.branchManagerId || req.user?.userId;

    connection = await createConnection();

    // Get auction info
    const [auctionInfo] = await connection.execute(
      `SELECT 
        a.auction_id,
        a.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        a.starting_price,
        a.current_highest_bid,
        a.duration_hours,
        a.start_time,
        a.end_time,
        a.auction_status,
        a.total_bids,
        a.highest_bidder_id,
        a.winner_applicant_id,
        a.created_by_manager,
        hb.applicant_full_name as highest_bidder_name,
        hb.applicant_contact_number as highest_bidder_contact,
        w.applicant_full_name as winner_name,
        b.branch_name,
        f.floor_name,
        sec.section_name,
        CASE 
          WHEN a.end_time IS NULL THEN 'Waiting for bidders'
          WHEN NOW() >= a.end_time THEN 'Expired'
          ELSE CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, NOW(), a.end_time) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, NOW(), a.end_time) % 3600) / 60), 'm ',
            (TIMESTAMPDIFF(SECOND, NOW(), a.end_time) % 60), 's'
          )
        END as time_remaining,
        TIMESTAMPDIFF(SECOND, NOW(), a.end_time) as seconds_remaining
      FROM auction a
      INNER JOIN stall s ON a.stall_id = s.stall_id
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN applicant hb ON a.highest_bidder_id = hb.applicant_id
      LEFT JOIN applicant w ON a.winner_applicant_id = w.applicant_id
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

    // Check if this branch manager owns this auction
    if (auction.created_by_manager !== branchManagerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this auction'
      });
    }

    // Get bid history
    const [bidHistory] = await connection.execute(
      `SELECT 
        ab.bid_id,
        ab.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        ab.bid_amount,
        ab.bid_time,
        ab.is_winning_bid
      FROM auction_bids ab
      INNER JOIN applicant a ON ab.applicant_id = a.applicant_id
      WHERE ab.auction_id = ?
      ORDER BY ab.bid_time DESC`,
      [auctionId]
    );

    // Get unique bidders count
    const [uniqueBidders] = await connection.execute(
      `SELECT COUNT(DISTINCT applicant_id) as count 
       FROM auction_bids 
       WHERE auction_id = ?`,
      [auctionId]
    );

    res.json({
      success: true,
      message: 'Auction details retrieved successfully',
      data: {
        ...auction,
        bidHistory: bidHistory,
        uniqueBiddersCount: uniqueBidders[0].count
      }
    });

  } catch (error) {
    console.error('❌ Get auction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve auction details',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};