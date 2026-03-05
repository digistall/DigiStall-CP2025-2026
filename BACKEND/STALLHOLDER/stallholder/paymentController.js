import { createConnection } from '../../../config/database.js';

/**
 * Get payment records for a stallholder
 * @route GET /api/mobile/stallholder/payments
 * @access Protected (Stallholder only)
 */
export const getPaymentRecords = async (req, res) => {
  let connection;
  
  try {
    const userData = req.user; // From auth middleware
    console.log('🔐 User data from token:', JSON.stringify(userData, null, 2));
    
    const { page = 1, limit = 10 } = req.query;
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Sanitize limit (1-100)
    const pageInt = Math.max(1, parseInt(page) || 1); // Sanitize page (min 1)
    const offsetInt = (pageInt - 1) * limitInt;
    
    connection = await createConnection();
    
    // Get ALL stallholder_ids from the database using the applicant/user ID
    const lookupId = userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    let stallholderIds = [];
    
    if (lookupId) {
      console.log('🔍 Looking up stallholder_ids for applicant/user ID:', lookupId);
      const [stallholderResult] = await connection.execute(
        'CALL sp_getStallholderIdByApplicant(?)',
        [lookupId]
      );
      if (stallholderResult[0] && stallholderResult[0].length > 0) {
        stallholderIds = stallholderResult[0].map(r => r.stallholder_id);
        console.log('✅ Found stallholder_ids:', stallholderIds);
      }
    }
    
    if (stallholderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No stallholder record found. Please contact support.',
        data: []
      });
    }
    
    console.log('📋 Fetching payment records for stallholders:', stallholderIds, 'page:', pageInt, 'limit:', limitInt);
    
    // Build placeholders for IN clause
    const placeholders = stallholderIds.map(() => '?').join(',');
    
    // Get total count of payments for ALL stalls (including penalty payments)
    // Use query() instead of execute() to avoid prepared statement issues with IN clause
    const [countRows] = await connection.query(
      `SELECT 
        (SELECT COUNT(*) FROM payments WHERE stallholder_id IN (${placeholders})) +
        (SELECT COUNT(*) FROM penalty_payments WHERE stallholder_id IN (${placeholders})) as total`,
      [...stallholderIds, ...stallholderIds]
    );
    const totalRecords = countRows[0]?.total || 0;
    
    // Get payment records with pagination for ALL stalls (regular + penalty payments combined)
    const [payments] = await connection.query(
      `(SELECT p.payment_id, p.amount, p.payment_date, p.payment_time, p.payment_status,
              p.payment_type, p.payment_for_month, p.payment_method, p.reference_number,
              p.collected_by, p.notes, p.created_at,
              s.stall_number,
              'regular' as source
       FROM payments p
       LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
       LEFT JOIN stall s ON sh.stall_id = s.stall_id
       WHERE p.stallholder_id IN (${placeholders}))
       UNION ALL
       (SELECT pp.penalty_payment_id as payment_id, pp.amount, pp.payment_date, pp.payment_time, pp.payment_status,
              'penalty' as payment_type, NULL as payment_for_month, pp.payment_method, pp.reference_number,
              pp.collected_by, pp.notes, pp.created_at,
              s.stall_number,
              'penalty' as source
       FROM penalty_payments pp
       LEFT JOIN stallholder sh ON pp.stallholder_id = sh.stallholder_id
       LEFT JOIN stall s ON sh.stall_id = s.stall_id
       WHERE pp.stallholder_id IN (${placeholders}))
       ORDER BY payment_date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...stallholderIds, ...stallholderIds, limitInt, offsetInt]
    );
    
    await connection.end();
    
    // Format the payment records
    const formattedPayments = payments.map(payment => ({
      id: payment.payment_id,
      date: formatDate(payment.payment_date),
      time: payment.payment_time,
      description: getPaymentDescription(payment.payment_type, payment.payment_for_month),
      amount: formatCurrency(payment.amount),
      rawAmount: parseFloat(payment.amount),
      status: capitalizeFirst(payment.payment_status),
      method: formatPaymentMethod(payment.payment_method),
      reference: payment.reference_number || 'N/A',
      collectedBy: payment.collected_by || 'N/A',
      stallNumber: payment.stall_number || 'N/A',
      notes: payment.notes || '',
      paymentForMonth: payment.payment_for_month,
      createdAt: payment.created_at
    }));
    
    console.log(`✅ Found ${payments.length} payment records for stallholders ${stallholderIds}`);
    
    return res.status(200).json({
      success: true,
      data: formattedPayments,
      pagination: {
        currentPage: pageInt,
        totalPages: Math.ceil(totalRecords / limitInt),
        totalRecords,
        limit: limitInt
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching payment records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment records',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
};

/**
 * Get all payment records for a stallholder (no pagination)
 * @route GET /api/mobile/stallholder/payments/all
 * @access Protected (Stallholder only)
 */
export const getAllPaymentRecords = async (req, res) => {
  let connection;
  
  try {
    const userData = req.user; // From auth middleware
    console.log('🔐 User data from token (getAllPaymentRecords):', JSON.stringify(userData, null, 2));
    
    connection = await createConnection();
    
    // Get ALL stallholder_ids for this applicant (supports multiple stalls)
    const lookupId = userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    if (!lookupId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify user. Please log out and log in again.',
        data: []
      });
    }
    
    console.log('🔍 Looking up ALL stallholder_ids for applicant/user ID:', lookupId);
    const [stallholderResult] = await connection.execute(
      'CALL sp_getStallholderIdByApplicant(?)',
      [lookupId]
    );
    const stallholderIds = (stallholderResult[0] || []).map(row => row.stallholder_id);
    
    if (stallholderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No stallholder record found. Please contact support.',
        data: []
      });
    }
    
    console.log('✅ Found stallholder_ids:', stallholderIds);
    console.log('📋 Fetching ALL payment records for all stallholders...');
    
    // Fetch payments for ALL stallholders (regular + penalty)
    let allPayments = [];
    for (const shId of stallholderIds) {
      // Get regular payments via stored procedure
      const [paymentResult] = await connection.execute(
        'CALL sp_getAllPaymentsByStallholder(?)',
        [shId]
      );
      const payments = (paymentResult[0] || []).map(p => ({ ...p, source: 'regular' }));
      allPayments = allPayments.concat(payments);
      
      // Get penalty payments
      const [penaltyResult] = await connection.query(
        `SELECT pp.penalty_payment_id as payment_id, pp.amount, pp.payment_date, pp.payment_time, 
                pp.payment_status, 'penalty' as payment_type, NULL as payment_for_month, 
                pp.payment_method, pp.reference_number, pp.collected_by, pp.notes, pp.created_at,
                s.stall_number, st.stall_type as stall_type, b.branch_name as branch_name,
                'penalty' as source
         FROM penalty_payments pp
         LEFT JOIN stallholder sh ON pp.stallholder_id = sh.stallholder_id
         LEFT JOIN stall s ON sh.stall_id = s.stall_id
         LEFT JOIN stall st ON sh.stall_id = st.stall_id
         LEFT JOIN branch b ON sh.branch_id = b.branch_id
         WHERE pp.stallholder_id = ?
         ORDER BY pp.payment_date DESC`,
        [shId]
      );
      allPayments = allPayments.concat(penaltyResult || []);
    }
    
    await connection.end();
    
    // Format the payment records (now includes stall_number)
    const formattedPayments = allPayments.map(payment => ({
      id: payment.payment_id,
      date: formatDate(payment.payment_date),
      time: payment.payment_time,
      description: getPaymentDescription(payment.payment_type, payment.payment_for_month),
      amount: formatCurrency(payment.amount),
      rawAmount: parseFloat(payment.amount),
      status: capitalizeFirst(payment.payment_status),
      method: formatPaymentMethod(payment.payment_method),
      reference: payment.reference_number || 'N/A',
      collectedBy: payment.collected_by || 'N/A',
      branch: payment.branch_name || 'N/A',
      notes: payment.notes || '',
      paymentForMonth: payment.payment_for_month,
      createdAt: payment.created_at,
      // NEW: Include stall information
      stallNumber: payment.stall_number || 'N/A',
      stallType: payment.stall_type || 'N/A'
    }));
    
    // Sort by date descending (newest first)
    formattedPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`✅ Found ${allPayments.length} total payment records for ${stallholderIds.length} stall(s)`);
    
    return res.status(200).json({
      success: true,
      data: formattedPayments,
      totalRecords: formattedPayments.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching all payment records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment records',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
};

/**
 * Get payment summary/statistics for a stallholder
 * @route GET /api/mobile/stallholder/payments/summary
 * @access Protected (Stallholder only)
 */
export const getPaymentSummary = async (req, res) => {
  let connection;
  
  try {
    const userData = req.user; // From auth middleware
    console.log('🔐 User data from token (getPaymentSummary):', JSON.stringify(userData, null, 2));
    
    connection = await createConnection();
    
    // Get the actual stallholder_id from the database
    let stallholderId = null;
    const lookupId = userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    if (lookupId) {
      console.log('🔍 Looking up stallholder_id for applicant/user ID:', lookupId);
      const [stallholderResult] = await connection.execute(
        'CALL sp_getStallholderIdByApplicant(?)',
        [lookupId]
      );
      if (stallholderResult[0] && stallholderResult[0].length > 0) {
        stallholderId = stallholderResult[0][0].stallholder_id;
        console.log('✅ Found stallholder_id:', stallholderId);
      }
    }
    
    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'No stallholder record found. Please contact support.'
      });
    }
    
    console.log('📊 Fetching payment summary for stallholder:', stallholderId);
    
    // Get payment summary statistics using stored procedure
    const [summaryResult] = await connection.execute(
      'CALL sp_getPaymentSummaryByStallholder(?)',
      [stallholderId]
    );
    const summary = summaryResult[0] || [];
    
    // Get stallholder's monthly rent and payment status using stored procedure
    const [stallholderResult] = await connection.execute(
      'CALL sp_getStallholderByApplicantId(?)',
      [stallholderId]
    );
    const stallholderInfo = stallholderResult[0] || [];
    
    await connection.end();
    
    const summaryData = summary[0];
    const stallholder = stallholderInfo[0] || {};
    
    return res.status(200).json({
      success: true,
      data: {
        totalPayments: summaryData.total_payments || 0,
        totalPaid: formatCurrency(summaryData.total_paid || 0),
        totalPaidRaw: parseFloat(summaryData.total_paid) || 0,
        totalPending: formatCurrency(summaryData.total_pending || 0),
        totalPendingRaw: parseFloat(summaryData.total_pending) || 0,
        completedCount: summaryData.completed_count || 0,
        pendingCount: summaryData.pending_count || 0,
        lastPaymentDate: summaryData.last_payment_date ? formatDate(summaryData.last_payment_date) : 'N/A',
        monthlyRent: formatCurrency(stallholder.monthly_rent || 0),
        monthlyRentRaw: parseFloat(stallholder.monthly_rent) || 0,
        currentPaymentStatus: capitalizeFirst(stallholder.payment_status || 'pending'),
        contractStartDate: stallholder.contract_start_date ? formatDate(stallholder.contract_start_date) : 'N/A',
        contractEndDate: stallholder.contract_end_date ? formatDate(stallholder.contract_end_date) : 'N/A'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching payment summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment summary',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
};

// Helper functions
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '₱' + num.toLocaleString('en-PH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatPaymentMethod(method) {
  const methodMap = {
    'onsite': 'Onsite',
    'online': 'Online',
    'bank_transfer': 'Bank Transfer',
    'check': 'Check',
    'gcash': 'GCash',
    'maya': 'Maya',
    'paymaya': 'PayMaya'
  };
  return methodMap[method?.toLowerCase()] || method || 'N/A';
}

function getPaymentDescription(type, forMonth) {
  const typeMap = {
    'rental': 'Monthly Stall Rent',
    'penalty': 'Late Payment Penalty',
    'deposit': 'Security Deposit',
    'maintenance': 'Maintenance Fee',
    'other': 'Other Payment'
  };
  
  let description = typeMap[type?.toLowerCase()] || 'Payment';
  
  if (forMonth) {
    // Convert YYYY-MM to readable format
    const [year, month] = forMonth.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1] || month;
    description += ` (${monthName} ${year})`;
  }
  
  return description;
}

/**
 * Get current month payment status for a stallholder
 * @route GET /api/mobile/stallholder/payments/monthly-status
 * @access Protected (Stallholder only)
 */
export const getMonthlyPaymentStatus = async (req, res) => {
  let connection;
  
  try {
    const userData = req.user; // From auth middleware
    console.log('🔐 User data from token (getMonthlyPaymentStatus):', JSON.stringify(userData, null, 2));
    
    const applicantId = userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    if (!applicantId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify stallholder. Please log out and log in again.'
      });
    }
    
    console.log('📅 Fetching monthly payment status for applicant:', applicantId);
    
    connection = await createConnection();
    
    // Get ALL stalls for this applicant (no longer LIMIT 1)
    const [spResult] = await connection.execute(
      'CALL sp_getStallInfoByApplicant(?)',
      [applicantId]
    );
    const allStalls = spResult[0] || [];
    console.log('📅 Found stalls:', allStalls.length);
    
    if (allStalls.length === 0) {
      await connection.end();
      return res.status(200).json({
        success: true,
        data: {
          stalls: [],
          currentMonth: '',
          currentMonthName: '',
          // Legacy single-stall fields for backward compatibility
          status: 'unpaid',
          stallNumber: 'N/A',
          amountDue: '₱0.00',
          monthlyRent: '₱0.00',
          isUnpaid: true,
          isPaid: false,
          isPending: false,
          statusMessage: 'No stalls found'
        }
      });
    }

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    console.log('📅 Checking payment for month:', currentMonth);

    // Build payment status for EACH stall
    const stallStatuses = [];
    for (const stallInfo of allStalls) {
      const shId = stallInfo.stallholder_id;
      const monthlyRent = parseFloat(stallInfo.monthly_rent) || 0;

      // Check completed payment
      const [paymentResult] = await connection.execute(
        `SELECT payment_id, amount, payment_date, payment_status, payment_for_month, payment_type
         FROM payments
         WHERE stallholder_id = ?
           AND payment_for_month = ?
           AND payment_status IN ('completed', 'paid')
           AND payment_type = 'rental'
         ORDER BY payment_date DESC
         LIMIT 1`,
        [shId, currentMonth]
      );

      // Check pending payment
      const [pendingResult] = await connection.execute(
        `SELECT payment_id, amount, payment_date, payment_status
         FROM payments
         WHERE stallholder_id = ?
           AND payment_for_month = ?
           AND payment_status = 'pending'
           AND payment_type = 'rental'
         ORDER BY created_at DESC
         LIMIT 1`,
        [shId, currentMonth]
      );

      const currentPayment = paymentResult[0];
      const pendingPayment = pendingResult[0];

      let status = 'unpaid';
      let statusMessage = '';
      let amountDue = monthlyRent;
      let paymentDate = null;

      if (currentPayment) {
        status = 'paid';
        statusMessage = `Payment completed for ${currentMonthName}`;
        amountDue = 0;
        paymentDate = formatDate(currentPayment.payment_date);
      } else if (pendingPayment) {
        status = 'pending';
        statusMessage = `Payment pending verification for ${currentMonthName}`;
        amountDue = monthlyRent;
      } else {
        status = 'unpaid';
        statusMessage = `Payment due for ${currentMonthName}`;
        amountDue = monthlyRent;
      }

      stallStatuses.push({
        stallholderId: shId,
        stallId: stallInfo.stall_id,
        stallNumber: stallInfo.stall_number || 'N/A',
        stallType: stallInfo.stall_type || 'N/A',
        status,
        statusMessage,
        isPaid: status === 'paid',
        isPending: status === 'pending',
        isUnpaid: status === 'unpaid',
        amountDue: formatCurrency(amountDue),
        amountDueRaw: amountDue,
        monthlyRent: formatCurrency(monthlyRent),
        monthlyRentRaw: monthlyRent,
        paymentDate,
        dueDate: getDueDate(now)
      });
    }

    await connection.end();

    // Use the first stall for backward-compatible single-stall fields
    const primary = stallStatuses[0];

    return res.status(200).json({
      success: true,
      data: {
        stalls: stallStatuses,
        currentMonth,
        currentMonthName,
        // Legacy single-stall fields for backward compatibility
        ...primary
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching monthly payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly payment status',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
};

// Helper function to get due date (5th of current month)
function getDueDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const dueDate = new Date(year, month, 5);
  return dueDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

