import { createConnection } from '../../../../config/database.js'

/**
 * Get all bidders for an auction by stall ID
 * Returns bidder information with their bid amounts and times
 */
export const getAuctionBiddersByStall = async (req, res) => {
  let connection;
  try {
    const { stallId } = req.params;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!stallId) {
      return res.status(400).json({
        success: false,
        message: 'Stall ID is required'
      });
    }

    console.log(`🏺 Fetching auction bidders for stall ID: ${stallId}`);

    connection = await createConnection();

    // First, verify the stall exists and is an auction stall
    const [stallRows] = await connection.execute(
      `SELECT 
        s.stall_id, s.stall_no, s.stall_location, s.rental_price, s.price_type,
        s.raffle_auction_status, s.is_available,
        f.floor_id, f.floor_name, f.branch_id,
        sec.section_id, sec.section_name,
        b.branch_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    if (!stallRows || stallRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const stall = stallRows[0];

    if (stall.price_type !== 'Auction') {
      return res.status(400).json({
        success: false,
        message: 'This stall is not an auction stall'
      });
    }

    // Verify user has access to this branch
    if (userType === 'business_manager') {
      const [managerCheck] = await connection.execute(
        `SELECT business_manager_id FROM business_manager 
         WHERE business_manager_id = ? AND branch_id = ?`,
        [userId, stall.branch_id]
      );
      if (managerCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this auction.'
        });
      }
    } else if (userType === 'business_employee') {
      if (branchId !== stall.branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This stall is not in your branch.'
        });
      }
    }

    // Get auction info
    const [auctionRows] = await connection.execute(
      `SELECT 
        a.auction_id, a.starting_price, a.current_highest_bid,
        a.auction_status, a.total_bids, a.duration_hours,
        a.start_time, a.end_time, a.highest_bidder_id,
        a.winner_applicant_id
      FROM auction a
      WHERE a.stall_id = ?
      ORDER BY a.created_at DESC LIMIT 1`,
      [stallId]
    );

    let auctionInfo = null;
    let bidders = [];

    if (auctionRows && auctionRows.length > 0) {
      const auction = auctionRows[0];

      // Get all unique bidders with their highest bids
      const [bidderRows] = await connection.execute(
        `SELECT 
          ab.bid_id,
          ab.applicant_id as bidder_id,
          ab.bid_amount,
          ab.bid_time,
          ab.is_winning_bid,
          a.applicant_full_name,
          a.applicant_contact_number,
          a.applicant_email,
          a.applicant_address,
          CASE WHEN ab.applicant_id = ? THEN 1 ELSE 0 END as is_winner
        FROM auction_bids ab
        INNER JOIN applicant a ON ab.applicant_id = a.applicant_id
        WHERE ab.auction_id = ?
        ORDER BY ab.bid_amount DESC, ab.bid_time ASC`,
        [auction.winner_applicant_id || 0, auction.auction_id]
      );

      // Get unique bidder count
      const [uniqueBidderCount] = await connection.execute(
        `SELECT COUNT(DISTINCT applicant_id) as count 
         FROM auction_bids 
         WHERE auction_id = ?`,
        [auction.auction_id]
      );

      auctionInfo = {
        auctionId: auction.auction_id,
        status: auction.auction_status || 'Active',
        startingPrice: auction.starting_price,
        highestBid: auction.current_highest_bid || auction.starting_price,
        totalBids: auction.total_bids || 0,
        totalBidders: uniqueBidderCount[0]?.count || 0,
        startTime: auction.start_time,
        endTime: auction.end_time,
        hasWinner: !!auction.winner_applicant_id
      };

      // Format bidders data - group by bidder and show their highest bid
      const bidderMap = new Map();
      for (const row of bidderRows) {
        const existingBidder = bidderMap.get(row.bidder_id);
        if (!existingBidder || row.bid_amount > existingBidder.bidAmount) {
          bidderMap.set(row.bidder_id, {
            bidderId: row.bidder_id,
            bidId: row.bid_id,
            bidAmount: parseFloat(row.bid_amount),
            bidTime: row.bid_time,
            isWinner: row.is_winner === 1 || row.is_winning_bid === 1,
            personalInfo: {
              fullName: row.applicant_full_name,
              email: row.applicant_email || 'N/A',
              contactNumber: row.applicant_contact_number || 'N/A',
              address: row.applicant_address || 'N/A'
            }
          });
        }
      }

      bidders = Array.from(bidderMap.values()).sort((a, b) => b.bidAmount - a.bidAmount);
    }

    const stallInfo = {
      stallId: stall.stall_id,
      stallNumber: stall.stall_no,
      location: stall.stall_location,
      startingPrice: stall.rental_price,
      rentalPrice: stall.rental_price,
      floorName: stall.floor_name,
      sectionName: stall.section_name,
      branchName: stall.branch_name
    };

    console.log(`✅ Found ${bidders.length} unique bidders for auction stall ${stallId}`);

    res.json({
      success: true,
      message: `Found ${bidders.length} bidders`,
      data: bidders,
      count: bidders.length,
      stallInfo: stallInfo,
      auctionInfo: auctionInfo
    });

  } catch (error) {
    console.error('❌ Get auction bidders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve auction bidders',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};
