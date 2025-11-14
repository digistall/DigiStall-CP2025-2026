import { createConnection } from '../../config/database.js';

/**
 * Payment Controller - Clean Implementation
 * Handles all payment operations using stored procedures for data integrity
 */
const PaymentController = {

  /**
   * Get stallholders by branch for payments
   */
  getStallholdersByBranch: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const branchId = req.query.branchId || req.user?.branchId || null;
      
      console.log('🔍 getStallholdersByBranch called with branchId:', branchId);
      
      // Use stored procedure
      const [result] = await connection.execute(
        'CALL getStallholdersByBranch(?)',
        [branchId] // Pass null if no branchId - this should return all stallholders
      );
      
      console.log('📊 Stored procedure result:', result[0]?.length || 0, 'stallholders found');
      
      res.status(200).json({
        success: true,
        message: 'Stallholders retrieved successfully',
        data: result[0] || []
      });
      
    } catch (error) {
      console.error('❌ Error fetching stallholders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stallholders',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get stallholder details for auto-population
   */
  getStallholderDetails: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { stallholderId } = req.params;
      
      if (!stallholderId) {
        return res.status(400).json({
          success: false,
          message: 'Stallholder ID is required'
        });
      }
      
      const [result] = await connection.execute(`
        SELECT 
          sh.stallholder_id,
          sh.stallholder_name,
          sh.contact_number,
          sh.business_name,
          sh.branch_id,
          COALESCE(st.stall_no, 'N/A') as stall_no,
          COALESCE(st.stall_location, 'N/A') as stall_location,
          COALESCE(st.monthly_rental, 0) as monthly_rental,
          COALESCE(b.branch_name, 'Unknown') as branch_name
        FROM stallholder sh
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.stallholder_id = ?
      `, [parseInt(stallholderId)]);
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Stallholder not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Stallholder details retrieved successfully',
        data: result[0]
      });
      
    } catch (error) {
      console.error('❌ Error fetching stallholder details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stallholder details',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get payment statistics
   */
  getPaymentStats: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { month } = req.query;
      const branchId = req.user?.branchId;
      
      // Use stored procedure
      const [result] = await connection.execute(
        'CALL getPaymentStats(?, ?)',
        [branchId || null, month || null]
      );
      
      const stats = result[0] || [];
      const processedStats = {
        totalPayments: 0,
        totalAmount: 0,
        methodBreakdown: {
          onsite: { count: 0, amount: 0 },
          online: { count: 0, amount: 0 },
          bank_transfer: { count: 0, amount: 0 },
          check: { count: 0, amount: 0 }
        }
      };
      
      stats.forEach(stat => {
        processedStats.totalPayments += stat.total_payments;
        processedStats.totalAmount += parseFloat(stat.total_amount || 0);
        
        if (stat.payment_method) {
          const method = stat.payment_method.toLowerCase();
          if (processedStats.methodBreakdown[method]) {
            processedStats.methodBreakdown[method].count += stat.total_payments;
            processedStats.methodBreakdown[method].amount += parseFloat(stat.total_amount || 0);
          }
        }
      });
      
      res.status(200).json({
        success: true,
        data: processedStats
      });
      
    } catch (error) {
      console.error('❌ Error fetching payment stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment statistics',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Add onsite payment with auto-generation features
   */
  addOnsitePayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const {
        stallholderId,
        amount,
        paymentDate,
        paymentTime,
        paymentForMonth,
        paymentType,
        notes
      } = req.body;
      
      if (!stallholderId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Stallholder ID and amount are required'
        });
      }
      
      // Auto-generate reference number
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = today.getHours().toString().padStart(2, '0') + 
                     today.getMinutes().toString().padStart(2, '0') + 
                     today.getSeconds().toString().padStart(2, '0');
      const referenceNumber = `RCP-${dateStr}-${timeStr}`;
      
      // Auto-fill collected_by with user's full name
      const collectedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System';
      const branchId = req.user?.branchId;
      const createdBy = req.user?.managerId || req.user?.employeeId;
      
      // Use stored procedure
      const [result] = await connection.execute(
        'CALL addOnsitePayment(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          parseInt(stallholderId),
          parseFloat(amount),
          paymentDate || new Date().toISOString().split('T')[0],
          paymentTime || new Date().toTimeString().split(' ')[0],
          paymentForMonth || null,
          paymentType || 'rental',
          referenceNumber,
          collectedBy,
          notes || null,
          branchId || null,
          createdBy || null
        ]
      );
      
      const response = result[0][0];
      
      if (response && response.success) {
        res.status(201).json({
          success: true,
          message: response.message,
          paymentId: response.payment_id,
          referenceNumber: referenceNumber
        });
      } else {
        res.status(400).json({
          success: false,
          message: response?.message || 'Failed to add payment'
        });
      }
      
    } catch (error) {
      console.error('❌ Error adding onsite payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add onsite payment',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get onsite payments
   */
  getOnsitePayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const {
        startDate,
        endDate,
        stallholderId,
        limit = 100,
        offset = 0
      } = req.query;
      
      const branchId = req.user?.branchId;
      
      // Use stored procedure
      const [result] = await connection.execute(
        'CALL getOnsitePayments(?, ?, ?, ?, ?)',
        [branchId || null, startDate || null, endDate || null, parseInt(limit), parseInt(offset)]
      );
      
      res.status(200).json({
        success: true,
        message: 'Onsite payments retrieved successfully',
        data: result[0] || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
      
    } catch (error) {
      console.error('❌ Error fetching onsite payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch onsite payments',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get all payments with filtering
   */
  getAllPayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const {
        branchId,
        paymentMethod,
        paymentStatus,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filterBranchId = branchId || req.user?.branchId || null;
      
      // Use stored procedure for getAllPayments
      const [result] = await connection.execute(
        'CALL getAllPayments(?, ?, ?, ?, ?, ?, ?)',
        [
          filterBranchId || null,
          paymentMethod || null,
          paymentStatus || null,
          startDate || null,
          endDate || null,
          parseInt(limit),
          parseInt(offset)
        ]
      );
      
      res.status(200).json({
        success: true,
        message: 'Payments retrieved successfully',
        data: result[0] || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: result[0]?.length === parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('❌ Error fetching all payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get online payments
   */
  getOnlinePayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const {
        limit = 50,
        offset = 0,
        status = 'all'
      } = req.query;
      
      const branchId = req.user?.branchId;
      
      let baseQuery = `
        SELECT 
          p.payment_id,
          p.amount,
          p.payment_date,
          p.payment_time,
          p.payment_method,
          p.payment_status,
          p.payment_type,
          p.payment_for_month,
          p.reference_number,
          p.notes,
          p.created_at,
          sh.stallholder_id,
          sh.stallholder_name,
          sh.contact_number,
          sh.business_name,
          COALESCE(st.stall_no, 'N/A') as stall_no,
          COALESCE(st.stall_location, 'N/A') as stall_location,
          COALESCE(b.branch_name, 'Unknown') as branch_name
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE p.payment_method IN ('online', 'bank_transfer')
      `;
      
      const queryParams = [];
      
      if (branchId) {
        baseQuery += ' AND sh.branch_id = ?';
        queryParams.push(branchId);
      }
      
      if (status !== 'all') {
        baseQuery += ' AND p.payment_status = ?';
        queryParams.push(status);
      }
      
      baseQuery += ' ORDER BY p.payment_date DESC, p.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const [result] = await connection.execute(baseQuery, queryParams);
      
      res.status(200).json({
        success: true,
        message: 'Online payments retrieved successfully',
        data: result || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
      
    } catch (error) {
      console.error('❌ Error fetching online payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch online payments',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Approve online payment
   */
  approvePayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { paymentId } = req.params;
      const { notes } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }
      
      const approvedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System';
      
      const [result] = await connection.execute(`
        UPDATE payments 
        SET 
          payment_status = 'approved',
          approved_by = ?,
          approved_at = NOW(),
          notes = CONCAT(COALESCE(notes, ''), ?, ?)
        WHERE payment_id = ? AND payment_method IN ('online', 'bank_transfer')
      `, [
        approvedBy,
        notes ? '\nApproval Notes: ' : '',
        notes || '',
        parseInt(paymentId)
      ]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or cannot be approved'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Payment approved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error approving payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve payment',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Decline online payment
   */
  declinePayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { paymentId } = req.params;
      const { reason } = req.body;
      
      if (!paymentId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID and reason are required'
        });
      }
      
      const declinedBy = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System';
      
      const [result] = await connection.execute(`
        UPDATE payments 
        SET 
          payment_status = 'declined',
          approved_by = ?,
          approved_at = NOW(),
          notes = CONCAT(COALESCE(notes, ''), ?, ?)
        WHERE payment_id = ? AND payment_method IN ('online', 'bank_transfer')
      `, [
        declinedBy,
        '\nDeclined - Reason: ',
        reason,
        parseInt(paymentId)
      ]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or cannot be declined'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Payment declined successfully'
      });
      
    } catch (error) {
      console.error('❌ Error declining payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decline payment',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  }

};

export default PaymentController;