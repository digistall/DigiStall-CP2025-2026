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
      
      const userInfo = PaymentController.extractUserFromToken(req);
      const managerId = userInfo.userId;
      
      console.log('🔍 getStallholdersByBranch called for manager:', managerId);
      
      const [result] = await connection.execute(
        'CALL sp_get_stallholders_for_manager(?)',
        [managerId]
      );
      
      const stallholders = result[0] || [];
      console.log('📊 Stallholders found for manager:', stallholders.length);
      
      res.status(200).json({
        success: true,
        message: 'Stallholders retrieved successfully',
        data: stallholders
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
      
      const userInfo = PaymentController.extractUserFromToken(req);
      const managerId = userInfo.userId;
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      console.log('📊 Getting payments for manager:', managerId, { limit, offset, search });
      
      const [result] = await connection.execute(
        'CALL sp_get_payments_for_manager(?, ?, ?, ?)',
        [managerId, limit, offset, search]
      );
      
      const payments = result[0] || [];
      console.log('📋 Payments found:', payments.length);
      
      res.status(200).json({
        success: true,
        message: 'Payments retrieved successfully',
        data: payments
      });
      
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments',
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
      
      const userInfo = PaymentController.extractUserFromToken(req);
      const managerId = userInfo.userId;
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      console.log('📊 Getting online payments for manager:', managerId, { limit, offset, search });
      
      const [result] = await connection.execute(
        'CALL sp_get_payments_for_manager(?, ?, ?, ?)',
        [managerId, limit, offset, search]
      );
      
      const allPayments = result[0] || [];
      const onlinePayments = allPayments.filter(payment => 
        ['online', 'gcash', 'maya', 'paymaya', 'bank_transfer'].includes(payment.paymentMethod?.toLowerCase())
      );
      
      console.log('📋 Online payments found:', onlinePayments.length);
      
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
      const userInfo = PaymentController.extractUserFromToken(req);
      const managerId = userInfo.userId;
      
      console.log('📊 Getting payment stats for manager:', managerId, 'month:', month);
      
      // Base query conditions
      let branchCondition = '';
      let params = [month];
      
      // Check if user is admin or branch-specific
      if (userInfo.userType !== 'admin' && userInfo.branchId) {
        branchCondition = 'AND p.branch_id = ?';
        params.push(userInfo.branchId);
      }
      
      const statsQuery = `
        SELECT
          COUNT(*) as totalPayments,
          SUM(CASE WHEN p.payment_method = 'online' THEN 1 ELSE 0 END) as onlinePayments,
          SUM(CASE WHEN p.payment_method = 'onsite' THEN 1 ELSE 0 END) as onsitePayments,
          SUM(p.amount) as totalAmount,
          SUM(CASE WHEN p.payment_method = 'online' THEN p.amount ELSE 0 END) as onlineAmount,
          SUM(CASE WHEN p.payment_method = 'onsite' THEN p.amount ELSE 0 END) as onsiteAmount,
          COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completedPayments,
          COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pendingPayments
        FROM payments p
        WHERE p.payment_for_month = ?
        ${branchCondition}
      `;
      
      const [statsResult] = await connection.execute(statsQuery, params);
      const stats = statsResult[0] || {
        totalPayments: 0,
        onlinePayments: 0,
        onsitePayments: 0,
        totalAmount: 0,
        onlineAmount: 0,
        onsiteAmount: 0,
        completedPayments: 0,
        pendingPayments: 0
      };
      
      console.log('📊 Payment stats retrieved:', stats);
      
      res.status(200).json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: {
          month: month,
          totalPayments: parseInt(stats.totalPayments),
          onlinePayments: parseInt(stats.onlinePayments),
          onsitePayments: parseInt(stats.onsitePayments),
          totalAmount: parseFloat(stats.totalAmount) || 0,
          onlineAmount: parseFloat(stats.onlineAmount) || 0,
          onsiteAmount: parseFloat(stats.onsiteAmount) || 0,
          completedPayments: parseInt(stats.completedPayments),
          pendingPayments: parseInt(stats.pendingPayments),
          averagePayment: stats.totalPayments > 0 ? parseFloat(stats.totalAmount) / parseInt(stats.totalPayments) : 0
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