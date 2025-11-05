import { createConnection } from '../../../../config/database.js'

// Get all active raffles for a branch manager or employee
export const getActiveRaffles = async (req, res) => {
  let connection;
  try {
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;

    console.log("🔍 getActiveRaffles - User details:", {
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

    let raffles = [];

    // Handle different user types
    if (userType === "branch_manager" || userType === "branch-manager") {
      // Branch manager: Get all raffles in their branch
      const branchManagerId = req.user?.branchManagerId || userId;

      console.log(`Fetching raffles for branch manager ID: ${branchManagerId}`);

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
        WHERE bm.branch_manager_id = ? AND s.price_type = 'Raffle'
        ORDER BY s.created_at DESC`,
        [branchManagerId]
      );

      raffles = result;
    } else if (userType === "employee") {
      // Employee: Check permissions first
      const permissions = req.user?.permissions || [];

      let hasStallsPermission = false;
      if (Array.isArray(permissions)) {
        hasStallsPermission = permissions.includes("stalls");
      } else {
        hasStallsPermission = permissions.stalls || false;
      }

      console.log("🔍 Employee permission check:", {
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

      console.log(`Fetching raffles for employee in branch ID: ${branchId}`);

      // Get all raffles in the employee's branch
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
        WHERE b.branch_id = ? AND s.price_type = 'Raffle'
        ORDER BY s.created_at DESC`,
        [branchId]
      );

      raffles = result;
    } else if (userType === "admin") {
      // Admin: Get all raffles
      console.log("Fetching all raffles for admin");

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
        WHERE s.price_type = 'Raffle'
        ORDER BY s.created_at DESC`
      );

      raffles = result;
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid user type.",
      });
    }

    console.log(`📋 Found ${raffles.length} raffle stalls for ${userType} ${userId}`);

    res.json({
      success: true,
      message: 'Raffle stalls retrieved successfully',
      data: raffles,
      counts: {
        total: raffles.length,
        available: raffles.filter(r => r.raffle_auction_status === 'Not Started').length,
        active: raffles.filter(r => r.raffle_auction_status === 'Active').length,
        ended: raffles.filter(r => r.raffle_auction_status === 'Ended').length
      }
    });

  } catch (error) {
    console.error('❌ Get active raffles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve raffles',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get raffle details including participants
export const getRaffleDetails = async (req, res) => {
  let connection;
  try {
    const { raffleId } = req.params;
    const branchManagerId = req.user?.branchManagerId || req.user?.userId;

    connection = await createConnection();

    // Get raffle info
    const [raffleInfo] = await connection.execute(
      `SELECT 
        r.raffle_id,
        r.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        r.duration_hours,
        r.start_time,
        r.end_time,
        r.raffle_status,
        r.total_participants,
        r.winner_applicant_id,
        w.applicant_full_name as winner_name,
        b.branch_name,
        f.floor_name,
        sec.section_name,
        r.created_by_manager,
        CASE 
          WHEN r.end_time IS NULL THEN 'Waiting for participants'
          WHEN NOW() >= r.end_time THEN 'Expired'
          ELSE CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, NOW(), r.end_time) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, NOW(), r.end_time) % 3600) / 60), 'm ',
            (TIMESTAMPDIFF(SECOND, NOW(), r.end_time) % 60), 's'
          )
        END as time_remaining,
        TIMESTAMPDIFF(SECOND, NOW(), r.end_time) as seconds_remaining
      FROM raffle r
      INNER JOIN stall s ON r.stall_id = s.stall_id
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN applicant w ON r.winner_applicant_id = w.applicant_id
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

    // Check if this branch manager owns this raffle
    if (raffle.created_by_manager !== branchManagerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this raffle'
      });
    }

    // Get participants
    const [participants] = await connection.execute(
      `SELECT 
        rp.participant_id,
        rp.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        rp.participation_time,
        rp.is_winner
      FROM raffle_participants rp
      INNER JOIN applicant a ON rp.applicant_id = a.applicant_id
      WHERE rp.raffle_id = ?
      ORDER BY rp.participation_time ASC`,
      [raffleId]
    );

    res.json({
      success: true,
      message: 'Raffle details retrieved successfully',
      data: {
        ...raffle,
        participants: participants
      }
    });

  } catch (error) {
    console.error('❌ Get raffle details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve raffle details',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};