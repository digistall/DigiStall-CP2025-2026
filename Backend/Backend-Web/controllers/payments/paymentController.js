import { createConnection } from '../../config/database.js';
import jwt from 'jsonwebtoken';
import { getBranchFilter } from '../../middleware/rolePermissions.js';

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
      if (!branchId && userInfo.userType !== 'system_administrator' && userInfo.userType !== 'stall_business_owner') {
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
        collectedBy,
        notes
      } = req.body;
      
      if (!stallholderId || !amount || !paymentDate || !referenceNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: stallholderId, amount, paymentDate, referenceNumber'
        });
      }
      
      console.log('💳 Adding onsite payment:', { stallholderId, amount, paymentDate, referenceNumber });
      
      // Call the enhanced addOnsitePayment procedure
      const [result] = await connection.execute(
        'CALL addOnsitePayment(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          parseInt(stallholderId),
          parseFloat(amount),
          paymentDate,
          paymentTime || null,
          paymentForMonth || null,
          paymentType || 'rental',
          referenceNumber,
          collectedBy || userInfo.username || 'System',
          notes || null,
          userInfo.branchId || null,
          userInfo.userId
        ]
      );
      
      if (!result[0] || result[0].length === 0) {
        throw new Error('Failed to add payment');
      }
      
      const paymentResult = result[0][0];
      
      // Check if payment was successful
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: paymentResult.message || 'Failed to add payment'
        });
      }
      
      console.log('✅ Payment added successfully:', paymentResult);
      
      res.status(201).json({
        success: true,
        message: paymentResult.message || 'Payment added successfully',
        paymentId: paymentResult.payment_id,
        amountPaid: paymentResult.amount_paid,
        monthlyRent: paymentResult.monthly_rent || 0,
        earlyDiscount: paymentResult.early_discount || 0,
        lateFee: paymentResult.late_fee || 0,
        daysEarly: paymentResult.days_early || 0,
        daysOverdue: paymentResult.days_overdue || 0,
        dueDate: paymentResult.due_date,
        receiptNumber: paymentResult.receipt_number
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
      
      // Get branch filter for proper multi-branch support
      const branchFilter = await getBranchFilter(req, connection);
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      console.log('📊 Getting onsite payments with branchFilter:', branchFilter, { limit, offset, search });
      
      let onsiteQuery;
      let queryParams;
      
      if (branchFilter === null) {
        // System administrator - see all
        console.log('🔍 Admin user - fetching all onsite payments');
        onsiteQuery = `
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
          WHERE p.payment_method = 'onsite'
          AND (
            ? = '' OR
            p.reference_number LIKE CONCAT('%', ?, '%') OR
            sh.stallholder_name LIKE CONCAT('%', ?, '%') OR
            st.stall_no LIKE CONCAT('%', ?, '%')
          )
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `;
        queryParams = [search, search, search, search, limit, offset];
      } else if (branchFilter.length === 0) {
        // No branches accessible
        console.log('⚠️ No branches accessible for onsite payments');
        return res.status(200).json({
          success: true,
          message: 'No payment data available',
          data: []
        });
      } else {
        // Filter by accessible branches (business owner or manager)
        const branchPlaceholders = branchFilter.map(() => '?').join(',');
        console.log(`🔍 Fetching onsite payments for branches: ${branchFilter.join(', ')}`);
        
        onsiteQuery = `
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
          WHERE sh.branch_id IN (${branchPlaceholders})
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
        queryParams = [...branchFilter, search, search, search, search, limit, offset];
      }
      
      // Use query() instead of execute() for better compatibility with IN clauses
      const [payments] = await connection.query(onsiteQuery, queryParams);
      
      console.log('📋 Onsite payments found:', payments.length);
      
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
      
      // Get branch filter based on user role
      const branchFilter = await getBranchFilter(req, connection);
      
      console.log('📊 Getting online payments with branchFilter:', branchFilter);
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      let onlineQuery;
      let queryParams;
      
      if (branchFilter === null) {
        // System administrator - see all
        console.log('🔍 Admin user - fetching all online payments');
        onlineQuery = `
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
          WHERE p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online')
          AND (
            ? = '' OR
            p.reference_number LIKE CONCAT('%', ?, '%') OR
            sh.stallholder_name LIKE CONCAT('%', ?, '%') OR
            st.stall_no LIKE CONCAT('%', ?, '%')
          )
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `;
        queryParams = [search, search, search, search, limit, offset];
      } else if (branchFilter.length === 0) {
        // No access
        console.log('⚠️ User has no branch access');
        return res.status(200).json({
          success: true,
          data: [],
          total: 0
        });
      } else {
        // Filter by accessible branches
        console.log(`🔍 Fetching online payments for branches: ${branchFilter.join(', ')}`);
        onlineQuery = `
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
          WHERE sh.branch_id IN (${branchFilter.map(() => '?').join(',')})
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
        queryParams = [...branchFilter, search, search, search, search, limit, offset];
      }
      
      // Use query() instead of execute() for better compatibility with IN clauses
      const [onlinePayments] = await connection.query(onlineQuery, queryParams);
      
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
      // Use validated user data from auth middleware
      const userInfo = req.user;
      
      // Get branch filter for proper multi-branch support
      const branchFilter = await getBranchFilter(req, connection);
      
      console.log('📊 Getting payment stats with branchFilter:', branchFilter, 'month:', month);
      
      let statsQuery;
      let queryParams;
      
      if (branchFilter === null) {
        // System administrator - see all
        console.log('🔍 Admin user - fetching all payment stats');
        statsQuery = `
          SELECT
            COUNT(*) as totalPayments,
            SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN 1 ELSE 0 END) as onlinePayments,
            SUM(CASE WHEN p.payment_method = 'onsite' THEN 1 ELSE 0 END) as onsitePayments,
            COALESCE(SUM(p.amount), 0) as totalAmount,
            COALESCE(SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN p.amount ELSE 0 END), 0) as onlineAmount,
            COALESCE(SUM(CASE WHEN p.payment_method = 'onsite' THEN p.amount ELSE 0 END), 0) as onsiteAmount,
            COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completedPayments,
            COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pendingPayments,
            SUM(CASE WHEN p.payment_method = 'gcash' THEN 1 ELSE 0 END) as gcashCount,
            SUM(CASE WHEN p.payment_method = 'maya' THEN 1 ELSE 0 END) as mayaCount,
            SUM(CASE WHEN p.payment_method = 'paymaya' THEN 1 ELSE 0 END) as paymayaCount,
            SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 ELSE 0 END) as bankTransferCount
          FROM payments p
          INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
          WHERE (? IS NULL OR p.payment_for_month = ?)
        `;
        queryParams = [month || null, month || null];
      } else if (branchFilter.length === 0) {
        // No branches accessible
        console.log('⚠️ No branches accessible for payment stats');
        return res.status(200).json({
          success: true,
          message: 'No payment data available',
          data: {
            month: month,
            totalPayments: 0,
            onlinePayments: 0,
            onsitePayments: 0,
            totalAmount: 0,
            onlineAmount: 0,
            onsiteAmount: 0,
            completedPayments: 0,
            pendingPayments: 0,
            averagePayment: 0,
            methodBreakdown: {
              onsite: { count: 0, amount: 0 },
              gcash: { count: 0, amount: 0 },
              maya: { count: 0, amount: 0 },
              paymaya: { count: 0, amount: 0 },
              bank_transfer: { count: 0, amount: 0 },
              online: { count: 0, amount: 0 }
            }
          }
        });
      } else {
        // Filter by accessible branches (business owner or manager)
        const branchPlaceholders = branchFilter.map(() => '?').join(',');
        console.log(`🔍 Fetching payment stats for branches: ${branchFilter.join(', ')}`);
        
        statsQuery = `
          SELECT
            COUNT(*) as totalPayments,
            SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN 1 ELSE 0 END) as onlinePayments,
            SUM(CASE WHEN p.payment_method = 'onsite' THEN 1 ELSE 0 END) as onsitePayments,
            COALESCE(SUM(p.amount), 0) as totalAmount,
            COALESCE(SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN p.amount ELSE 0 END), 0) as onlineAmount,
            COALESCE(SUM(CASE WHEN p.payment_method = 'onsite' THEN p.amount ELSE 0 END), 0) as onsiteAmount,
            COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completedPayments,
            COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pendingPayments,
            SUM(CASE WHEN p.payment_method = 'gcash' THEN 1 ELSE 0 END) as gcashCount,
            SUM(CASE WHEN p.payment_method = 'maya' THEN 1 ELSE 0 END) as mayaCount,
            SUM(CASE WHEN p.payment_method = 'paymaya' THEN 1 ELSE 0 END) as paymayaCount,
            SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 ELSE 0 END) as bankTransferCount
          FROM payments p
          INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
          WHERE sh.branch_id IN (${branchPlaceholders})
          AND (? IS NULL OR p.payment_for_month = ?)
        `;
        queryParams = [...branchFilter, month || null, month || null];
      }
      
      const [statsResult] = await connection.execute(statsQuery, queryParams);
      
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
      
      console.log('📊 Payment stats retrieved:', stats);
      
      res.status(200).json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: {
          month: month,
          branchIds: branchFilter,
          totalPayments: parseInt(stats.totalPayments) || 0,
          onlinePayments: parseInt(stats.onlinePayments) || 0,
          onsitePayments: parseInt(stats.onsitePayments) || 0,
          totalAmount: parseFloat(stats.totalAmount) || 0,
          onlineAmount: parseFloat(stats.onlineAmount) || 0,
          onsiteAmount: parseFloat(stats.onsiteAmount) || 0,
          completedPayments: parseInt(stats.completedPayments) || 0,
          pendingPayments: parseInt(stats.pendingPayments) || 0,
          averagePayment: stats.totalPayments > 0 ? parseFloat(stats.totalAmount) / parseInt(stats.totalPayments) : 0,
          methodBreakdown: {
            onsite: { count: parseInt(stats.onsitePayments) || 0, amount: parseFloat(stats.onsiteAmount) || 0 },
            gcash: { count: parseInt(stats.gcashCount) || 0, amount: 0 },
            maya: { count: parseInt(stats.mayaCount) || 0, amount: 0 },
            paymaya: { count: parseInt(stats.paymayaCount) || 0, amount: 0 },
            bank_transfer: { count: parseInt(stats.bankTransferCount) || 0, amount: 0 },
            online: { count: parseInt(stats.onlinePayments) || 0, amount: parseFloat(stats.onlineAmount) || 0 }
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
  },

  /**
   * Get unpaid violations for a stallholder
   * @route GET /api/payments/violations/unpaid/:stallholderId
   */
  getUnpaidViolations: async (req, res) => {
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
      
      console.log('🔍 getUnpaidViolations called for stallholderId:', stallholderId);
      
      const [result] = await connection.execute(
        'CALL getUnpaidViolationsByStallholder(?)',
        [parseInt(stallholderId)]
      );
      
      const violations = result[0] || [];
      console.log('📊 Unpaid violations found:', violations.length);
      
      res.status(200).json({
        success: true,
        message: 'Unpaid violations retrieved successfully',
        data: violations.map(v => ({
          violationId: v.violation_id,
          dateReported: v.date_reported,
          violationType: v.violation_type,
          ordinanceNo: v.ordinance_no,
          offenseNo: v.offense_no,
          severity: v.severity,
          status: v.status,
          receiptNumber: v.receipt_number,
          penaltyAmount: parseFloat(v.penalty_amount) || 0,
          penaltyRemarks: v.penalty_remarks,
          inspectorName: v.inspector_name,
          branchName: v.branch_name,
          stallNo: v.stall_no,
          stallholderId: v.stallholder_id
        }))
      });
      
    } catch (error) {
      console.error('❌ Error fetching unpaid violations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unpaid violations',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Process violation payment
   * @route POST /api/payments/violations/pay
   */
  processViolationPayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const { violationId, paymentReference, paidAmount, notes } = req.body;
      
      // Validate required fields
      if (!violationId || !paymentReference || !paidAmount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: violationId, paymentReference, and paidAmount are required'
        });
      }
      
      // Get collected by info from token
      const userInfo = req.user;
      const collectedBy = userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'System' : 'System';
      
      console.log('💳 Processing violation payment:', {
        violationId,
        paymentReference,
        paidAmount,
        collectedBy,
        notes
      });
      
      const [result] = await connection.execute(
        'CALL processViolationPayment(?, ?, ?, ?, ?)',
        [
          parseInt(violationId),
          paymentReference,
          parseFloat(paidAmount),
          collectedBy,
          notes || null
        ]
      );
      
      const paymentResult = result[0]?.[0];
      
      if (!paymentResult) {
        return res.status(404).json({
          success: false,
          message: 'Failed to process payment - violation not found'
        });
      }
      
      console.log('✅ Violation payment processed:', paymentResult);
      
      res.status(200).json({
        success: true,
        message: 'Violation payment processed successfully',
        data: {
          reportId: paymentResult.report_id,
          status: paymentResult.status,
          paymentDate: paymentResult.payment_date,
          paymentReference: paymentResult.payment_reference,
          paidAmount: parseFloat(paymentResult.paid_amount) || 0,
          collectedBy: paymentResult.collected_by,
          violationType: paymentResult.violation_type,
          originalPenalty: parseFloat(paymentResult.original_penalty) || 0,
          stallholderName: paymentResult.stallholder_name,
          stallNo: paymentResult.stall_no,
          branchName: paymentResult.branch_name
        }
      });
      
    } catch (error) {
      console.error('❌ Error processing violation payment:', error);
      
      // Handle specific error messages from stored procedure
      if (error.message.includes('Violation report not found')) {
        return res.status(404).json({
          success: false,
          message: 'Violation report not found'
        });
      }
      
      if (error.message.includes('already been paid')) {
        return res.status(400).json({
          success: false,
          message: 'This violation has already been paid'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process violation payment',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  }
};

export default PaymentController;