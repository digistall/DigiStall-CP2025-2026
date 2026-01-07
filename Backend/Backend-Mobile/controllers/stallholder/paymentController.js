import { createConnection } from '../../config/database.js';

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
    
    let stallholderId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    // If stallholderId is null but we have applicantId, try to look up stallholder_id from database
    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify stallholder. Please log out and log in again.',
        data: []
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('📋 Fetching payment records for stallholder:', stallholderId);
    
    connection = await createConnection();
    
    // If we only have applicantId, try to get stallholder_id from stallholder table
    if (userData.applicantId && !userData.stallholderId) {
      const [stallholderRows] = await connection.execute(
        'SELECT stallholder_id FROM stallholder WHERE applicant_id = ? LIMIT 1',
        [userData.applicantId]
      );
      if (stallholderRows.length > 0) {
        stallholderId = stallholderRows[0].stallholder_id;
        console.log('📋 Found stallholder_id from applicant_id:', stallholderId);
      }
    }
    
    // Get total count of payments
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM payments WHERE stallholder_id = ?`,
      [stallholderId]
    );
    const totalRecords = countResult[0].total;
    
    // Get payment records with pagination
    const [payments] = await connection.execute(
      `SELECT 
        p.payment_id,
        p.stallholder_id,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.collected_by,
        p.payment_status,
        p.notes,
        p.branch_id,
        p.created_at,
        b.branch_name
       FROM payments p
       LEFT JOIN branch b ON p.branch_id = b.branch_id
       WHERE p.stallholder_id = ?
       ORDER BY p.payment_date DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [stallholderId, parseInt(limit), offset]
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
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
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
    
    let stallholderId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify stallholder. Please log out and log in again.',
        data: []
      });
    }
    
    console.log('📋 Fetching ALL payment records for stallholder:', stallholderId);
    
    connection = await createConnection();
    
    // If we only have applicantId, try to get stallholder_id from stallholder table
    if (userData.applicantId && !userData.stallholderId) {
      const [stallholderRows] = await connection.execute(
        'SELECT stallholder_id FROM stallholder WHERE applicant_id = ? LIMIT 1',
        [userData.applicantId]
      );
      if (stallholderRows.length > 0) {
        stallholderId = stallholderRows[0].stallholder_id;
        console.log('📋 Found stallholder_id from applicant_id:', stallholderId);
      }
    }
    
    // Get all payment records
    const [payments] = await connection.execute(
      `SELECT 
        p.payment_id,
        p.stallholder_id,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.collected_by,
        p.payment_status,
        p.notes,
        p.branch_id,
        p.created_at,
        b.branch_name
       FROM payments p
       LEFT JOIN branch b ON p.branch_id = b.branch_id
       WHERE p.stallholder_id = ?
       ORDER BY p.payment_date DESC, p.created_at DESC`,
      [stallholderId]
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
    
    let stallholderId = userData.stallholderId || userData.stallholder_id || userData.applicantId || userData.applicant_id || userData.userId || userData.id;
    
    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify stallholder. Please log out and log in again.'
      });
    }
    
    console.log('📊 Fetching payment summary for stallholder:', stallholderId);
    
    connection = await createConnection();
    
    // If we only have applicantId, try to get stallholder_id from stallholder table
    if (userData.applicantId && !userData.stallholderId) {
      const [stallholderRows] = await connection.execute(
        'SELECT stallholder_id FROM stallholder WHERE applicant_id = ? LIMIT 1',
        [userData.applicantId]
      );
      if (stallholderRows.length > 0) {
        stallholderId = stallholderRows[0].stallholder_id;
        console.log('📊 Found stallholder_id from applicant_id:', stallholderId);
      }
    }
    
    // Get payment summary statistics
    const [summary] = await connection.execute(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        MAX(payment_date) as last_payment_date
       FROM payments 
       WHERE stallholder_id = ?`,
      [stallholderId]
    );
    
    // Get stallholder's monthly rent and payment status
    const [stallholderInfo] = await connection.execute(
      `SELECT 
        monthly_rent,
        payment_status,
        last_payment_date,
        contract_start_date,
        contract_end_date
       FROM stallholder 
       WHERE stallholder_id = ? OR applicant_id = ?`,
      [stallholderId, stallholderId]
    );
    
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
