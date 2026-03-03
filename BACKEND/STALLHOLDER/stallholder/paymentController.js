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
    
    // Get the actual stallholder_id from the database using the applicant/user ID
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
        message: 'No stallholder record found. Please contact support.',
        data: []
      });
    }
    
    console.log('📋 Fetching payment records for stallholder:', stallholderId, 'page:', pageInt, 'limit:', limitInt);
    
    // Get total count of payments using stored procedure
    const [countResult] = await connection.execute(
      'CALL sp_getPaymentCountByStallholder(?)',
      [stallholderId]
    );
    const totalRecords = countResult[0]?.[0]?.total || 0;
    
    // Get payment records with pagination using stored procedure
    const [paymentResult] = await connection.execute(
      'CALL sp_getPaymentsByStallholderPaginated(?, ?, ?)',
      [stallholderId, limitInt, offsetInt]
    );
    const payments = paymentResult[0] || [];
    
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
      branch: payment.branch_name || 'N/A',
      notes: payment.notes || '',
      paymentForMonth: payment.payment_for_month,
      createdAt: payment.created_at
    }));
    
    console.log(`✅ Found ${payments.length} payment records for stallholder ${stallholderId}`);
    
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
        message: 'No stallholder record found. Please contact support.',
        data: []
      });
    }
    
    console.log('📋 Fetching ALL payment records for stallholder:', stallholderId);
    
    // Get all payment records using stored procedure
    const [paymentResult] = await connection.execute(
      'CALL sp_getAllPaymentsByStallholder(?)',
      [stallholderId]
    );
    const payments = paymentResult[0] || [];
    
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
      branch: payment.branch_name || 'N/A',
      notes: payment.notes || '',
      paymentForMonth: payment.payment_for_month,
      createdAt: payment.created_at
    }));
    
    console.log(`✅ Found ${payments.length} total payment records for stallholder ${stallholderId}`);
    
    return res.status(200).json({
      success: true,
      data: formattedPayments,
      totalRecords: payments.length
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
    
    let stallholderId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify stallholder. Please log out and log in again.'
      });
    }
    
    console.log('📅 Fetching monthly payment status for stallholder:', stallholderId);
    
    connection = await createConnection();
    
    // If we only have applicantId, try to get stallholder_id
    if (userData.applicantId && !userData.stallholderId) {
      const [stallholderResult] = await connection.execute(
        'CALL sp_getStallholderIdByApplicant(?)',
        [userData.applicantId]
      );
      if (stallholderResult[0] && stallholderResult[0].length > 0) {
        stallholderId = stallholderResult[0][0].stallholder_id;
        console.log('📅 Found stallholder_id from applicant_id:', stallholderId);
      }
    }
    
    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    console.log('📅 Checking payment for month:', currentMonth);
    
    // Check if there's a completed payment for the current month
    const [paymentResult] = await connection.execute(
      `SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_status,
        p.payment_for_month,
        p.payment_type
      FROM payments p
      WHERE p.stallholder_id = ?
        AND p.payment_for_month = ?
        AND p.payment_status IN ('completed', 'paid')
        AND p.payment_type = 'rental'
      ORDER BY p.payment_date DESC
      LIMIT 1`,
      [stallholderId, currentMonth]
    );
    
    // Get stallholder info - use applicant_id to call stored procedure
    const applicantId = userData.userId || userData.applicantId || userData.id;
    console.log('📅 Looking up stall info for applicant_id:', applicantId);

    // Use sp_getStallInfoByApplicant stored procedure
    const [spResult] = await connection.execute(
      'CALL sp_getStallInfoByApplicant(?)',
      [applicantId]
    );
    const stallInfo = spResult[0]?.[0] || {};
    console.log('📅 Stall info from SP:', JSON.stringify(stallInfo));
    
    // Check for any pending payment for current month
    const [pendingResult] = await connection.execute(
      `SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_status
      FROM payments p
      WHERE p.stallholder_id = ?
        AND p.payment_for_month = ?
        AND p.payment_status = 'pending'
        AND p.payment_type = 'rental'
      ORDER BY p.created_at DESC
      LIMIT 1`,
      [stallholderId, currentMonth]
    );
    
    await connection.end();
    
    const currentPayment = paymentResult[0];
    const pendingPayment = pendingResult[0];
    const monthlyRent = parseFloat(stallInfo.monthly_rent) || 0;
    
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
    
    return res.status(200).json({
      success: true,
      data: {
        currentMonth: currentMonth,
        currentMonthName: currentMonthName,
        status: status,
        statusMessage: statusMessage,
        isPaid: status === 'paid',
        isPending: status === 'pending',
        isUnpaid: status === 'unpaid',
        amountDue: formatCurrency(amountDue),
        amountDueRaw: amountDue,
        monthlyRent: formatCurrency(monthlyRent),
        monthlyRentRaw: monthlyRent,
        paymentDate: paymentDate,
        stallNumber: stallInfo.stall_number || 'N/A',
        stallType: stallInfo.stall_type || 'N/A',
        dueDate: getDueDate(now)
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

