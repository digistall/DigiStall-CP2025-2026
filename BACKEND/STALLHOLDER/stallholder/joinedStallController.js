import { createConnection } from '../../../config/database.js';

/**
 * Get all stalls the user has joined via raffle or auction participation
 * Filters out stalls that already have an active stallholder
 * 
 * @route GET /api/mobile/stallholder/joined-stalls
 * @access Protected (Stallholder only)
 */
export const getJoinedStalls = async (req, res) => {
  let connection;

  try {
    const userData = req.user;
    let applicantId = userData.applicantId || userData.applicant_id || userData.userId || userData.id;

    if (!applicantId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify user. Please log out and log in again.',
        data: { stalls: [], total_joined: 0 }
      });
    }

    console.log('🎟️ Fetching joined stalls for applicant:', applicantId);

    connection = await createConnection();

    // Get raffle participations
    const [raffleRows] = await connection.query(
      `SELECT 
        rp.participant_id,
        rp.raffle_id,
        rp.ticket_number,
        rp.registration_date,
        rp.status AS participation_status,
        r.stall_id,
        r.status AS raffle_status,
        r.draw_date,
        s.stall_number,
        s.stall_location,
        s.stall_size,
        s.monthly_rent,
        s.stall_type,
        b.branch_id,
        b.branch_name,
        b.area AS branch_area,
        'Raffle' AS join_type
      FROM raffle_participants rp
      JOIN raffle r ON rp.raffle_id = r.raffle_id
      JOIN stall s ON r.stall_id = s.stall_id
      JOIN branch b ON s.branch_id = b.branch_id
      WHERE rp.applicant_id = ? AND rp.status != 'removed'
      ORDER BY rp.registration_date DESC`,
      [applicantId]
    );

    // Get auction participations
    const [auctionRows] = await connection.query(
      `SELECT 
        ap.participant_id,
        ap.auction_id,
        ap.bid_amount,
        ap.registration_date,
        ap.status AS participation_status,
        a.stall_id,
        a.status AS auction_status,
        a.end_date AS auction_end_date,
        s.stall_number,
        s.stall_location,
        s.stall_size,
        s.monthly_rent,
        s.stall_type,
        b.branch_id,
        b.branch_name,
        b.area AS branch_area,
        'Auction' AS join_type
      FROM auction_participants ap
      JOIN auction a ON ap.auction_id = a.auction_id
      JOIN stall s ON a.stall_id = s.stall_id
      JOIN branch b ON s.branch_id = b.branch_id
      WHERE ap.applicant_id = ? AND ap.status != 'removed'
      ORDER BY ap.registration_date DESC`,
      [applicantId]
    );

    // Get stalls with active stallholders (to filter out)
    const [occupiedRows] = await connection.query(
      `SELECT DISTINCT stall_id FROM stallholder WHERE status = 'active'`
    );
    const occupiedStallIds = new Set(occupiedRows.map(r => r.stall_id));

    // Combine and filter
    const allJoined = [...raffleRows, ...auctionRows];
    const filtered = allJoined.filter(s => !occupiedStallIds.has(s.stall_id));

    // Enrich with stall images
    const enrichedStalls = [];
    for (const stall of filtered) {
      let stallImage = null;
      if (stall.stall_id) {
        try {
          const [imageResult] = await connection.execute(
            'CALL sp_getStallPrimaryImage(?)',
            [stall.stall_id]
          );
          if (imageResult[0] && imageResult[0].length > 0) {
            const imgRow = imageResult[0][0];
            if (imgRow.image_data) {
              stallImage = `data:${imgRow.mime_type || 'image/jpeg'};base64,${imgRow.image_data.toString('base64')}`;
            }
          }
        } catch (imgError) {
          console.log('📷 Could not fetch stall image for stall_id:', stall.stall_id);
        }
      }

      enrichedStalls.push({
        participant_id: stall.participant_id,
        stall_id: stall.stall_id,
        stall_number: stall.stall_number,
        stall_location: stall.stall_location,
        stall_size: stall.stall_size,
        stall_type: stall.stall_type,
        monthly_rent: stall.monthly_rent ? parseFloat(stall.monthly_rent) : 0,
        branch_id: stall.branch_id,
        branch_name: stall.branch_name,
        branch_area: stall.branch_area,
        join_type: stall.join_type,
        participation_status: stall.participation_status,
        registration_date: stall.registration_date,
        ticket_number: stall.ticket_number || null,
        bid_amount: stall.bid_amount ? parseFloat(stall.bid_amount) : null,
        raffle_id: stall.raffle_id || null,
        auction_id: stall.auction_id || null,
        raffle_status: stall.raffle_status || null,
        auction_status: stall.auction_status || null,
        event_date: stall.draw_date || stall.auction_end_date || null,
        stall_image: stallImage,
      });
    }

    // Sort by registration date descending
    enrichedStalls.sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date));

    console.log(`✅ Found ${enrichedStalls.length} joined stalls (${raffleRows.length} raffle, ${auctionRows.length} auction, ${allJoined.length - filtered.length} filtered out)`);

    return res.status(200).json({
      success: true,
      message: `Found ${enrichedStalls.length} joined stall(s)`,
      data: {
        stalls: enrichedStalls,
        total_joined: enrichedStalls.length,
        raffle_count: enrichedStalls.filter(s => s.join_type === 'Raffle').length,
        auction_count: enrichedStalls.filter(s => s.join_type === 'Auction').length,
      }
    });

  } catch (error) {
    console.error('❌ Get Joined Stalls Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch joined stalls',
      data: { stalls: [], total_joined: 0 }
    });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (e) { /* ignore */ }
    }
  }
};
