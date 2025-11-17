import { createConnection } from '../../config/database.js';
import jwt from 'jsonwebtoken';

const PaymentController = {
  extractUserFromToken(req) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('No token provided');
      }
      
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token');
      }
      
      return {
        userId: decoded.userId,
        userType: decoded.userType,
        branchId: decoded.branchId,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        fullName: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim()
      };
    } catch (error) {
      console.error('❌ Error extracting user from token:', error);
      throw new Error('Authentication failed');
    }
  },

  getStallholdersByBranch: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      console.log('🔍 getStallholdersByBranch started');
      console.log('🔍 User from middleware:', req.user);
      
      // Use validated user data from auth middleware instead of re-parsing token
      const userInfo = req.user;
      if (!userInfo) {
        console.log('❌ No user data from auth middleware');
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      console.log('🔍 User info from middleware:', userInfo);
      
      const branchId = userInfo.branchId;
      console.log('🔍 Branch ID extracted:', branchId);
      
      // Security check: Ensure user has branchId
      if (!branchId && userInfo.userType !== 'admin') {
        console.log('❌ Branch access denied - no branchId found');
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      
      console.log('🔍 getStallholdersByBranch called for branch:', branchId);
      
      // Use stored procedure for consistency with working getStallholderDetails
      console.log('🔍 Executing stored procedure with branchId:', branchId);
      const [result] = await connection.execute(
        'CALL sp_get_all_stallholders(?)',
        [branchId]
      );
      
      // Extract stallholders from stored procedure result
      const stallholders = result[0] || [];
      console.log('📊 Stallholders found for branch', branchId + ':', stallholders.length);
      
      res.status(200).json({
        success: true,
        message: 'Stallholders retrieved successfully',
        data: stallholders
      });
      
    } catch (error) {
      console.error('❌ Error fetching stallholders:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Check if it's a token error
      if (error.message.includes('Authentication failed')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stallholders',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      if (connection) await connection.end();
    }
  },

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
      
      console.log('🔍 getStallholderDetails called for stallholderId:', stallholderId);
      
      const [result] = await connection.execute(
        'CALL sp_get_stallholder_details(?)',
        [parseInt(stallholderId)]
      );
      
      if (!result[0] || result[0].length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Stallholder not found'
        });
      }
      
      console.log('📊 Stallholder details found:', result[0][0]);
      
      res.status(200).json({
        success: true,
        message: 'Stallholder details retrieved successfully',
        data: result[0][0]
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

  generateReceiptNumber: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      console.log('🔢 Generating receipt number');
      
      const [result] = await connection.execute('CALL sp_generate_receipt_number()');
      
      if (!result[0] || result[0].length === 0) {
        throw new Error('Failed to generate receipt number');
      }
      
      const receiptNumber = result[0][0].receiptNumber;
      console.log('📋 Receipt number generated:', receiptNumber);
      
      res.status(200).json({
        success: true,
        message: 'Receipt number generated successfully',
        receiptNumber: receiptNumber
      });
      
    } catch (error) {
      console.error('❌ Error generating receipt number:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt number',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  addOnsitePayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const userInfo = PaymentController.extractUserFromToken(req);
      
      const {
        stallholderId,
        amount,
        paymentDate,
        paymentTime,
        paymentForMonth,
        paymentType,
        referenceNumber,
        notes
      } = req.body;
      
      if (!stallholderId || !amount || !paymentDate || !referenceNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: stallholderId, amount, paymentDate, referenceNumber'
        });
      }
      
      console.log('💳 Adding onsite payment:', { stallholderId, amount, paymentDate, referenceNumber });
      
      const [result] = await connection.execute(
        'CALL sp_add_payment(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          parseInt(stallholderId),
          parseFloat(amount),
          paymentDate,
          paymentTime || '00:00:00',
          paymentForMonth || null,
          paymentType || 'rental',
          'cash',
          referenceNumber,
          userInfo.userId,
          notes || null
        ]
      );
      
      if (!result[0] || result[0].length === 0) {
        throw new Error('Failed to add payment');
      }
      
      const paymentResult = result[0][0];
      console.log('✅ Payment added successfully:', paymentResult);
      
      res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        paymentId: paymentResult.paymentId,
        referenceNumber: paymentResult.referenceNumber
      });
      
    } catch (error) {
      console.error('❌ Error adding onsite payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add payment',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  getOnsitePayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      // Use validated user data from auth middleware
      const userInfo = req.user;
      const branchId = userInfo.branchId;
      
      // Security check: Ensure user has branchId
      if (!branchId && userInfo.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      console.log('📊 Getting onsite payments for branch:', branchId, { limit, offset, search });
      
      // Direct query with branch filtering for onsite payments only
      const onsiteQuery = `
        SELECT 
          p.payment_id as id,
          p.stallholder_id as stallholderId,
          sh.stallholder_name as stallholderName,
          COALESCE(st.stall_no, 'N/A') as stallNo,
          p.amount as amountPaid,
          p.payment_date as paymentDate,
          p.payment_time as paymentTime,
          p.payment_for_month as paymentForMonth,
          p.payment_type as paymentType,
          'Cash (Onsite)' as paymentMethod,
          p.reference_number as referenceNo,
          p.collected_by as collectedBy,
          p.notes,
          p.payment_status as status,
          p.created_at as createdAt,
          COALESCE(b.branch_name, 'Unknown') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE (? IS NULL OR sh.branch_id = ?)
        AND p.payment_method = 'onsite'
        AND (
          ? = '' OR
          p.reference_number LIKE CONCAT('%', ?, '%') OR
          sh.stallholder_name LIKE CONCAT('%', ?, '%') OR
          st.stall_no LIKE CONCAT('%', ?, '%')
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [payments] = await connection.execute(onsiteQuery, [
        branchId, branchId, search, search, search, search, limit, offset
      ]);
      
      console.log('📋 Onsite payments found for branch', branchId + ':', payments.length);
      
      res.status(200).json({
        success: true,
        message: 'Onsite payments retrieved successfully',
        data: payments
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

  getOnlinePayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      // Use validated user data from auth middleware
      const userInfo = req.user;
      const branchId = userInfo.branchId;
      
      // Security check: Ensure user has branchId
      if (!branchId && userInfo.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      console.log('📊 Getting online payments for branch:', branchId, { limit, offset, search });
      
      // Direct query with branch filtering for online payments only
      const onlineQuery = `
        SELECT 
          p.payment_id as id,
          p.stallholder_id as stallholderId,
          sh.stallholder_name as stallholderName,
          COALESCE(st.stall_no, 'N/A') as stallNo,
          p.amount as amountPaid,
          p.payment_date as paymentDate,
          p.payment_time as paymentTime,
          p.payment_for_month as paymentForMonth,
          p.payment_type as paymentType,
          CASE 
            WHEN p.payment_method = 'gcash' THEN 'GCash'
            WHEN p.payment_method = 'maya' THEN 'Maya'
            WHEN p.payment_method = 'paymaya' THEN 'PayMaya'
            WHEN p.payment_method = 'bank_transfer' THEN 'Bank Transfer'
            ELSE 'Online Payment'
          END as paymentMethod,
          p.reference_number as referenceNo,
          p.notes,
          p.payment_status as status,
          p.created_at as createdAt,
          COALESCE(b.branch_name, 'Unknown') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE (? IS NULL OR sh.branch_id = ?)
        AND p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online')
        AND (
          ? = '' OR
          p.reference_number LIKE CONCAT('%', ?, '%') OR
          sh.stallholder_name LIKE CONCAT('%', ?, '%') OR
          st.stall_no LIKE CONCAT('%', ?, '%')
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [onlinePayments] = await connection.execute(onlineQuery, [
        branchId, branchId, search, search, search, search, limit, offset
      ]);
      
      console.log('📋 Online payments found for branch', branchId + ':', onlinePayments.length);
      
      res.status(200).json({
        success: true,
        message: 'Online payments retrieved successfully',
        data: onlinePayments
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

  approvePayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { paymentId } = req.params;
      const userInfo = PaymentController.extractUserFromToken(req);
      
      console.log('✅ Approving payment:', paymentId, 'by:', userInfo.fullName);
      
      const [result] = await connection.execute(
        'UPDATE payment SET payment_status = ?, approved_by = ?, approved_at = NOW() WHERE payment_id = ?',
        ['approved', userInfo.fullName, paymentId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
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

  declinePayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { paymentId } = req.params;
      const { reason } = req.body;
      const userInfo = PaymentController.extractUserFromToken(req);
      
      console.log('❌ Declining payment:', paymentId, 'by:', userInfo.fullName, 'reason:', reason);
      
      const [result] = await connection.execute(
        'UPDATE payment SET payment_status = ?, declined_by = ?, declined_at = NOW(), decline_reason = ? WHERE payment_id = ?',
        ['declined', userInfo.fullName, reason || 'No reason provided', paymentId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
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
  },

  getPaymentStats: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { month } = req.query;
      // Use validated user data from auth middleware
      const userInfo = req.user;
      const branchId = userInfo.branchId;
      
      // Security check: Ensure user has branchId (except for admin)
      if (!branchId && userInfo.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      
      console.log('📊 Getting payment stats for branch:', branchId, 'month:', month);
      
      // Direct query with proper branch filtering using stallholder branch_id
      const statsQuery = `
        SELECT
          COUNT(*) as totalPayments,
          SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN 1 ELSE 0 END) as onlinePayments,
          SUM(CASE WHEN p.payment_method = 'onsite' THEN 1 ELSE 0 END) as onsitePayments,
          SUM(p.amount) as totalAmount,
          SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN p.amount ELSE 0 END) as onlineAmount,
          SUM(CASE WHEN p.payment_method = 'onsite' THEN p.amount ELSE 0 END) as onsiteAmount,
          COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completedPayments,
          COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pendingPayments,
          SUM(CASE WHEN p.payment_method = 'gcash' THEN 1 ELSE 0 END) as gcashCount,
          SUM(CASE WHEN p.payment_method = 'maya' THEN 1 ELSE 0 END) as mayaCount,
          SUM(CASE WHEN p.payment_method = 'paymaya' THEN 1 ELSE 0 END) as paymayaCount,
          SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 ELSE 0 END) as bankTransferCount
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        WHERE (? IS NULL OR p.payment_for_month = ?)
        AND (? IS NULL OR sh.branch_id = ?)
      `;
      
      const [statsResult] = await connection.execute(statsQuery, [
        month, month, branchId, branchId
      ]);
      
      const stats = statsResult[0] || {
        totalPayments: 0,
        onlinePayments: 0,
        onsitePayments: 0,
        totalAmount: 0,
        onlineAmount: 0,
        onsiteAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        gcashCount: 0,
        mayaCount: 0,
        paymayaCount: 0,
        bankTransferCount: 0
      };
      
      console.log('📊 Payment stats retrieved for branch', branchId + ':', stats);
      
      res.status(200).json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: {
          month: month,
          branchId: branchId,
          totalPayments: parseInt(stats.totalPayments),
          onlinePayments: parseInt(stats.onlinePayments),
          onsitePayments: parseInt(stats.onsitePayments),
          totalAmount: parseFloat(stats.totalAmount) || 0,
          onlineAmount: parseFloat(stats.onlineAmount) || 0,
          onsiteAmount: parseFloat(stats.onsiteAmount) || 0,
          completedPayments: parseInt(stats.completedPayments),
          pendingPayments: parseInt(stats.pendingPayments),
          averagePayment: stats.totalPayments > 0 ? parseFloat(stats.totalAmount) / parseInt(stats.totalPayments) : 0,
          methodBreakdown: {
            onsite: { count: parseInt(stats.onsitePayments), amount: parseFloat(stats.onsiteAmount) || 0 },
            gcash: { count: parseInt(stats.gcashCount), amount: 0 },
            maya: { count: parseInt(stats.mayaCount), amount: 0 },
            paymaya: { count: parseInt(stats.paymayaCount), amount: 0 },
            bank_transfer: { count: parseInt(stats.bankTransferCount), amount: 0 },
            online: { count: parseInt(stats.onlinePayments), amount: parseFloat(stats.onlineAmount) || 0 }
          }
        }
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
  }
};

export default PaymentController;