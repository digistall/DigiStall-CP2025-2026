import { createConnection } from '../../../config/database.js';

/**
 * Get all owned/rented stalls for a stallholder, grouped by branch
 * This uses the mobile_user_id (applicant_id) to find all stallholder records
 * across different branches
 * 
 * @route GET /api/mobile/stallholder/owned-stalls
 * @access Protected (Stallholder only)
 */
export const getOwnedStalls = async (req, res) => {
  let connection;

  try {
    const userData = req.user;
    console.log('?? Owned Stalls - User data from token:', JSON.stringify(userData, null, 2));

    let applicantId = userData.applicantId || userData.applicant_id || userData.userId || userData.id;

    if (!applicantId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify user. Please log out and log in again.',
        data: { stalls: [], branches: [], total_stalls: 0, total_monthly_rent: 0 }
      });
    }

    console.log('?? Fetching owned stalls for applicant:', applicantId);

    connection = await createConnection();

    // Get all stallholder records for this applicant across all branches
    // Direct query to check both mobile_user_id AND applicant_id
    const [rawStalls] = await connection.execute(
      `SELECT 
        sh.stallholder_id,
        sh.full_name as stallholder_name,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_contact,
        sh.address as stallholder_address,
        sh.branch_id,
        sh.stall_id,
        sh.payment_status,
        sh.status as contract_status,
        sh.move_in_date as contract_start_date,
        s.stall_number,
        s.size,
        s.rental_price as monthly_rent,
        s.stall_location,
        s.price_type as stall_type,
        b.branch_name,
        b.area as branch_area
      FROM stallholder sh
      LEFT JOIN stall s ON sh.stall_id = s.stall_id
      LEFT JOIN branch b ON sh.branch_id = b.branch_id
      WHERE sh.mobile_user_id = ? OR sh.applicant_id = ?`,
      [applicantId, applicantId]
    );
    console.log('?? Raw stalls from DB:', rawStalls.length);

    // For each stall, get additional details (images, payment info)
    const enrichedStalls = [];
    for (const stall of rawStalls) {
      // Get primary image for the stall
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
          console.log('?? Could not fetch stall image for stall_id:', stall.stall_id);
        }
      }

      // Get latest payment info for this stallholder
      let lastPayment = null;
      let nextPaymentDue = null;
      if (stall.stallholder_id) {
        try {
          const [payResult] = await connection.execute(
            `SELECT payment_date, payment_for_month, amount, payment_status 
             FROM payments 
             WHERE stallholder_id = ? 
             ORDER BY payment_date DESC 
             LIMIT 1`,
            [stall.stallholder_id]
          );
          if (payResult.length > 0) {
            lastPayment = {
              date: payResult[0].payment_date,
              for_month: payResult[0].payment_for_month,
              amount: parseFloat(payResult[0].amount),
              status: payResult[0].payment_status
            };
          }

          // Determine next payment due  
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          const [paidCheck] = await connection.execute(
            `SELECT COUNT(*) as paid_count 
             FROM payments 
             WHERE stallholder_id = ? 
             AND payment_for_month = ? 
             AND payment_status = 'completed'`,
            [stall.stallholder_id, currentMonth]
          );
          
          const isPaidThisMonth = paidCheck[0]?.paid_count > 0;
          nextPaymentDue = {
            month: isPaidThisMonth 
              ? `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`
              : currentMonth,
            is_current_month_paid: isPaidThisMonth
          };
        } catch (payError) {
          console.log('?? Could not fetch payment info for stallholder_id:', stall.stallholder_id);
        }
      }

      enrichedStalls.push({
        stallholder_id: stall.stallholder_id,
        stall_id: stall.stall_id,
        stall_number: stall.stall_number || 'N/A',
        stall_location: stall.stall_location || 'N/A',
        stall_size: stall.size || 'N/A',
        stall_type: stall.stall_type || 'Fixed Price',
        monthly_rent: parseFloat(stall.monthly_rent) || 0,
        payment_status: stall.payment_status || 'unpaid',
        contract_status: stall.contract_status || 'active',
        contract_start_date: stall.contract_start_date || null,
        branch_id: stall.branch_id,
        branch_name: stall.branch_name || 'Unknown Branch',
        branch_area: stall.branch_area || 'Unknown Area',
        stall_image: stallImage,
        last_payment: lastPayment,
        next_payment_due: nextPaymentDue
      });
    }

    // Group stalls by branch
    const groupedByBranch = {};
    const branchList = [];
    let totalMonthlyRent = 0;

    enrichedStalls.forEach(stall => {
      const branchKey = stall.branch_id || 'unknown';
      if (!groupedByBranch[branchKey]) {
        groupedByBranch[branchKey] = {
          branch_id: stall.branch_id,
          branch_name: stall.branch_name,
          branch_area: stall.branch_area,
          stalls: [],
          total_rent: 0
        };
        branchList.push({
          branch_id: stall.branch_id,
          branch_name: stall.branch_name,
          branch_area: stall.branch_area
        });
      }
      groupedByBranch[branchKey].stalls.push(stall);
      groupedByBranch[branchKey].total_rent += stall.monthly_rent;
      totalMonthlyRent += stall.monthly_rent;
    });

    console.log(`? Found ${enrichedStalls.length} owned stalls across ${branchList.length} branches`);

    return res.status(200).json({
      success: true,
      data: {
        stalls: enrichedStalls,
        grouped_by_branch: Object.values(groupedByBranch),
        branches: branchList,
        total_stalls: enrichedStalls.length,
        total_monthly_rent: totalMonthlyRent
      },
      message: `Found ${enrichedStalls.length} owned stall(s)`
    });

  } catch (error) {
    console.error('? Error fetching owned stalls:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owned stalls',
      error: error.message,
      data: { stalls: [], branches: [], total_stalls: 0, total_monthly_rent: 0 }
    });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (e) { /* ignore */ }
    }
  }
};
