import { createConnection } from '../../config/database.js';
import jwt from 'jsonwebtoken';
import { getBranchFilter } from '../../middleware/rolePermissions.js';
import { decryptData } from '../../services/encryptionService.js';

// Helper function to decrypt data safely (handles both encrypted and plain text)
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

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
      
      // Use direct query instead of stored procedure for compatibility
      console.log('🔍 Executing query with branchId:', branchId);
      let query;
      let params;
      
      if (branchId) {
        query = `
          SELECT 
            sh.stallholder_id as id,
            sh.full_name as name,
            sh.full_name as stallholder_name,
            sh.contact_number as contact,
            sh.email,
            sh.address,
            sh.stall_id,
            s.stall_number as stallNo,
            s.stall_number,
            s.stall_location as stallLocation,
            s.rental_price as monthlyRental,
            s.rental_price,
            sh.branch_id,
            b.branch_name as branchName,
            b.branch_name,
            sh.status as contract_status,
            sh.payment_status,
            sh.move_in_date as contract_start_date,
            sh.full_name as businessName,
            sh.full_name as business_name
          FROM stallholder sh
          LEFT JOIN stall s ON sh.stall_id = s.stall_id
          LEFT JOIN branch b ON sh.branch_id = b.branch_id
          WHERE sh.branch_id = ?
          ORDER BY sh.stallholder_id
        `;
        params = [branchId];
      } else {
        // For system admin or business owner, get all stallholders
        query = `
          SELECT 
            sh.stallholder_id as id,
            sh.full_name as name,
            sh.full_name as stallholder_name,
            sh.contact_number as contact,
            sh.email,
            sh.address,
            sh.stall_id,
            s.stall_number as stallNo,
            s.stall_number,
            s.stall_location as stallLocation,
            s.rental_price as monthlyRental,
            s.rental_price,
            sh.branch_id,
            b.branch_name as branchName,
            b.branch_name,
            sh.status as contract_status,
            sh.payment_status,
            sh.move_in_date as contract_start_date,
            sh.full_name as businessName,
            sh.full_name as business_name
          FROM stallholder sh
          LEFT JOIN stall s ON sh.stall_id = s.stall_id
          LEFT JOIN branch b ON sh.branch_id = b.branch_id
          ORDER BY sh.stallholder_id
        `;
        params = [];
      }
      
      const [result] = await connection.execute(query, params);
      
      // Extract stallholders from query result
      const stallholders = result || [];
      console.log('📊 Stallholders found for branch', branchId + ':', stallholders.length);
      
      // Debug: Log first stallholder BEFORE decryption
      if (stallholders.length > 0) {
        console.log('🔍 Sample stallholder BEFORE decryption:', JSON.stringify(stallholders[0], null, 2));
      }
      
      // Backend-level decryption for stallholder data
      const decryptedStallholders = stallholders.map(stallholder => {
        // Decrypt name field (supports both 'name' and 'stallholder_name' keys)
        const nameField = stallholder.name || stallholder.stallholder_name;
        if (nameField && typeof nameField === 'string' && nameField.includes(':')) {
          try {
            const decrypted = decryptData(nameField);
            if (stallholder.name) stallholder.name = decrypted;
            if (stallholder.stallholder_name) stallholder.stallholder_name = decrypted;
          } catch (error) {
            console.error(`Failed to decrypt name for ID ${stallholder.id || stallholder.stallholder_id}:`, error.message);
          }
        }
        
        // Decrypt business_name field (supports both 'businessName' and 'business_name' keys)
        const businessField = stallholder.businessName || stallholder.business_name;
        if (businessField && typeof businessField === 'string' && businessField.includes(':')) {
          try {
            const decrypted = decryptData(businessField);
            if (stallholder.businessName) stallholder.businessName = decrypted;
            if (stallholder.business_name) stallholder.business_name = decrypted;
          } catch (error) {
            console.error(`Failed to decrypt business_name for ID ${stallholder.id || stallholder.stallholder_id}:`, error.message);
          }
        }
        
        // Decrypt contact field (supports both 'contact' and 'stallholder_contact' keys)
        const contactField = stallholder.contact || stallholder.stallholder_contact || stallholder.contact_number;
        if (contactField && typeof contactField === 'string' && contactField.includes(':')) {
          try {
            const decrypted = decryptData(contactField);
            if (stallholder.contact) stallholder.contact = decrypted;
            if (stallholder.stallholder_contact) stallholder.stallholder_contact = decrypted;
            if (stallholder.contact_number) stallholder.contact_number = decrypted;
          } catch (error) {
            console.error(`Failed to decrypt contact for ID ${stallholder.id || stallholder.stallholder_id}:`, error.message);
          }
        }
        
        // Decrypt address field
        const addressField = stallholder.stallholder_address || stallholder.address;
        if (addressField && typeof addressField === 'string' && addressField.includes(':')) {
          try {
            const decrypted = decryptData(addressField);
            if (stallholder.stallholder_address) stallholder.stallholder_address = decrypted;
            if (stallholder.address) stallholder.address = decrypted;
          } catch (error) {
            console.error(`Failed to decrypt address for ID ${stallholder.id || stallholder.stallholder_id}:`, error.message);
          }
        }
        
        return stallholder;
      });
      
      // Debug: Log first stallholder AFTER decryption
      if (decryptedStallholders.length > 0) {
        console.log('✅ Sample stallholder AFTER decryption:', JSON.stringify(decryptedStallholders[0], null, 2));
      }
      
      res.status(200).json({
        success: true,
        message: 'Stallholders retrieved successfully',
        data: decryptedStallholders
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
      
      // Use direct query instead of stored procedure for compatibility
      const [result] = await connection.execute(`
        SELECT 
          sh.stallholder_id as id,
          sh.stallholder_id,
          sh.full_name as name,
          sh.full_name as stallholder_name,
          sh.full_name as businessName,
          sh.full_name as business_name,
          sh.email,
          sh.contact_number as contact,
          sh.contact_number,
          sh.address,
          sh.stall_id,
          sh.branch_id,
          sh.payment_status,
          sh.status as contract_status,
          sh.move_in_date as contract_start_date,
          sh.created_at,
          sh.updated_at,
          s.stall_number as stallNo,
          s.stall_number,
          s.stall_location as stallLocation,
          s.stall_location,
          s.rental_price as monthlyRental,
          s.rental_price,
          s.stall_size,
          s.area_sqm,
          b.branch_name as branchName,
          b.branch_name
        FROM stallholder sh
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.stallholder_id = ?
      `, [parseInt(stallholderId)]);
      
      if (!result || result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Stallholder not found'
        });
      }
      
      console.log('📊 Stallholder details found:', result[0]);
      
      // Backend-level decryption for stallholder details
      const stallholder = result[0];
      
      // Decrypt name (supports both 'name' and 'stallholder_name')
      const nameField = stallholder.name || stallholder.stallholder_name;
      if (nameField && typeof nameField === 'string' && nameField.includes(':')) {
        try {
          const decrypted = decryptData(nameField);
          if (stallholder.name) stallholder.name = decrypted;
          if (stallholder.stallholder_name) stallholder.stallholder_name = decrypted;
        } catch (error) {
          console.error(`Failed to decrypt name for ID ${stallholderId}:`, error.message);
        }
      }
      
      // Decrypt business_name (supports both 'businessName' and 'business_name')
      const businessField = stallholder.businessName || stallholder.business_name;
      if (businessField && typeof businessField === 'string' && businessField.includes(':')) {
        try {
          const decrypted = decryptData(businessField);
          if (stallholder.businessName) stallholder.businessName = decrypted;
          if (stallholder.business_name) stallholder.business_name = decrypted;
        } catch (error) {
          console.error(`Failed to decrypt business_name for ID ${stallholderId}:`, error.message);
        }
      }
      
      // Decrypt contact (supports multiple field names)
      const contactField = stallholder.contact || stallholder.stallholder_contact || stallholder.contact_number;
      if (contactField && typeof contactField === 'string' && contactField.includes(':')) {
        try {
          const decrypted = decryptData(contactField);
          if (stallholder.contact) stallholder.contact = decrypted;
          if (stallholder.stallholder_contact) stallholder.stallholder_contact = decrypted;
          if (stallholder.contact_number) stallholder.contact_number = decrypted;
        } catch (error) {
          console.error(`Failed to decrypt contact for ID ${stallholderId}:`, error.message);
        }
      }
      
      // Decrypt address
      const addressField = stallholder.stallholder_address || stallholder.address;
      if (addressField && typeof addressField === 'string' && addressField.includes(':')) {
        try {
          const decrypted = decryptData(addressField);
          if (stallholder.stallholder_address) stallholder.stallholder_address = decrypted;
          if (stallholder.address) stallholder.address = decrypted;
        } catch (error) {
          console.error(`Failed to decrypt address for ID ${stallholderId}:`, error.message);
        }
      }
      
      res.status(200).json({
        success: true,
        message: 'Stallholder details retrieved successfully',
        data: stallholder
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
      
      // Get stallholder's branch_id if not provided
      let branchId = userInfo.branchId;
      if (!branchId) {
        const [shResult] = await connection.execute(
          'SELECT branch_id FROM stallholder WHERE stallholder_id = ?',
          [parseInt(stallholderId)]
        );
        if (shResult.length > 0) {
          branchId = shResult[0].branch_id;
        }
      }
      
      // Use direct INSERT instead of stored procedure for compatibility
      const [insertResult] = await connection.execute(`
        INSERT INTO payments (
          stallholder_id,
          branch_id,
          amount,
          payment_date,
          payment_time,
          payment_for_month,
          payment_type,
          payment_method,
          reference_number,
          collected_by,
          notes,
          payment_status,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'onsite', ?, ?, ?, 'completed', ?, NOW())
      `, [
        parseInt(stallholderId),
        branchId,
        parseFloat(amount),
        paymentDate,
        paymentTime || null,
        paymentForMonth || null,
        paymentType || 'rental',
        referenceNumber,
        collectedBy || userInfo.username || 'System',
        notes || null,
        userInfo.userId
      ]);
      
      const paymentId = insertResult.insertId;
      
      if (!paymentId) {
        throw new Error('Failed to add payment');
      }
      
      // Update stallholder payment status
      await connection.execute(
        "UPDATE stallholder SET payment_status = 'paid' WHERE stallholder_id = ?",
        [parseInt(stallholderId)]
      );
      
      console.log('✅ Payment added successfully:', { paymentId, amount, referenceNumber });
      
      res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        paymentId: paymentId,
        amountPaid: parseFloat(amount),
        monthlyRent: 0,
        earlyDiscount: 0,
        lateFee: 0,
        daysEarly: 0,
        daysOverdue: 0,
        dueDate: null,
        receiptNumber: referenceNumber
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
      
      // Debug logging disabled
      
      let onsiteQuery;
      let queryParams;
      
      if (branchFilter === null) {
        // System administrator - see all using direct query for compatibility
        const [result] = await connection.execute(`
          SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.full_name as stallholderName,
            sh.full_name as businessName,
            COALESCE(st.stall_number, 'N/A') as stallNo,
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
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `, [limit, offset]);
        const payments = result || [];
        
        // Backend-level decryption for payment data
        const decryptedPayments = payments.map(payment => {
          // Decrypt stallholder_name or stallholderName
          const nameField = payment.stallholder_name || payment.stallholderName;
          if (nameField && typeof nameField === 'string' && nameField.includes(':')) {
            try {
              const decrypted = decryptData(nameField);
              if (payment.stallholder_name) payment.stallholder_name = decrypted;
              if (payment.stallholderName) payment.stallholderName = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt stallholder name for payment ID ${payment.id}:`, error.message);
            }
          }
          
          // Decrypt collected_by / collector_name / collectedBy
          const collectorField = payment.collected_by || payment.collector_name || payment.collectedBy;
          if (collectorField && typeof collectorField === 'string' && collectorField.includes(':')) {
            try {
              const decrypted = decryptData(collectorField);
              if (payment.collected_by) payment.collected_by = decrypted;
              if (payment.collector_name) payment.collector_name = decrypted;
              if (payment.collectedBy) payment.collectedBy = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt collector for payment ID ${payment.id}:`, error.message);
            }
          }
          
          return payment;
        });
        
        return res.status(200).json({
          success: true,
          message: 'Onsite payments retrieved successfully',
          data: decryptedPayments
        });
      } else if (branchFilter.length === 0) {
        // No branches accessible
        return res.status(200).json({
          success: true,
          message: 'No payment data available',
          data: []
        });
      } else {
        // Filter by accessible branches using direct query for compatibility
        const branchIdsString = branchFilter.join(',');
        const placeholders = branchFilter.map(() => '?').join(',');
        const [result] = await connection.execute(`
          SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.full_name as stallholderName,
            sh.full_name as businessName,
            COALESCE(st.stall_number, 'N/A') as stallNo,
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
          AND sh.branch_id IN (${placeholders})
          ORDER BY p.created_at DESC
        `, branchFilter);
        const payments = result || [];
        
        // Backend-level decryption for payment data
        const decryptedPayments = payments.map(payment => {
          // Decrypt stallholder_name or stallholderName
          const nameField = payment.stallholder_name || payment.stallholderName;
          if (nameField && typeof nameField === 'string' && nameField.includes(':')) {
            try {
              const decrypted = decryptData(nameField);
              if (payment.stallholder_name) payment.stallholder_name = decrypted;
              if (payment.stallholderName) payment.stallholderName = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt stallholder name for payment ID ${payment.id}:`, error.message);
            }
          }
          
          // Decrypt collected_by / collector_name / collectedBy
          const collectorField = payment.collected_by || payment.collector_name || payment.collectedBy;
          if (collectorField && typeof collectorField === 'string' && collectorField.includes(':')) {
            try {
              const decrypted = decryptData(collectorField);
              if (payment.collected_by) payment.collected_by = decrypted;
              if (payment.collector_name) payment.collector_name = decrypted;
              if (payment.collectedBy) payment.collectedBy = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt collector for payment ID ${payment.id}:`, error.message);
            }
          }
          
          return payment;
        });
        
        return res.status(200).json({
          success: true,
          message: 'Onsite payments retrieved successfully',
          data: decryptedPayments
        });
      }
      
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
      
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      if (branchFilter === null) {
        // System administrator - see all using direct query for compatibility
        const [result] = await connection.execute(`
          SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.full_name as stallholderName,
            sh.full_name as businessName,
            COALESCE(st.stall_number, 'N/A') as stallNo,
            p.amount as amountPaid,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            'Online' as paymentMethod,
            p.reference_number as referenceNo,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, 'Unknown') as branchName
          FROM payments p
          INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
          LEFT JOIN stall st ON sh.stall_id = st.stall_id
          LEFT JOIN branch b ON sh.branch_id = b.branch_id
          WHERE p.payment_method = 'online'
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `, [limit, offset]);
        const payments = result || [];
        
        // Backend-level decryption for online payment data
        const decryptedPayments = payments.map(payment => {
          // Decrypt stallholder_name or stallholderName
          const nameField = payment.stallholder_name || payment.stallholderName;
          if (nameField && typeof nameField === 'string' && nameField.includes(':')) {
            try {
              const decrypted = decryptData(nameField);
              if (payment.stallholder_name) payment.stallholder_name = decrypted;
              if (payment.stallholderName) payment.stallholderName = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt stallholder name for payment ID ${payment.id}:`, error.message);
            }
          }
          
          return payment;
        });
        
        return res.status(200).json({
          success: true,
          message: 'Online payments retrieved successfully',
          data: decryptedPayments
        });
      } else if (branchFilter.length === 0) {
        // No access
        return res.status(200).json({
          success: true,
          data: [],
          total: 0
        });
      } else {
        // Filter by accessible branches using direct query for compatibility
        const branchIdsString = branchFilter.join(',');
        const placeholders = branchFilter.map(() => '?').join(',');
        const [result] = await connection.execute(`
          SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.full_name as stallholderName,
            sh.full_name as businessName,
            COALESCE(st.stall_number, 'N/A') as stallNo,
            p.amount as amountPaid,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            'Online' as paymentMethod,
            p.reference_number as referenceNo,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, 'Unknown') as branchName
          FROM payments p
          INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
          LEFT JOIN stall st ON sh.stall_id = st.stall_id
          LEFT JOIN branch b ON sh.branch_id = b.branch_id
          WHERE p.payment_method = 'online'
          AND sh.branch_id IN (${placeholders})
          ORDER BY p.created_at DESC
        `, branchFilter);
        const payments = result || [];
        
        // Backend-level decryption for online payment data
        const decryptedPayments = payments.map(payment => {
          // Decrypt stallholder_name or stallholderName
          const nameField = payment.stallholder_name || payment.stallholderName;
          if (nameField && typeof nameField === 'string' && nameField.includes(':')) {
            try {
              const decrypted = decryptData(nameField);
              if (payment.stallholder_name) payment.stallholder_name = decrypted;
              if (payment.stallholderName) payment.stallholderName = decrypted;
            } catch (error) {
              console.error(`Failed to decrypt stallholder name for payment ID ${payment.id}:`, error.message);
            }
          }
          
          return payment;
        });
        
        return res.status(200).json({
          success: true,
          message: 'Online payments retrieved successfully',
          data: decryptedPayments
        });
      }
      
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
      
      // Use stored procedure to approve payment
      const [result] = await connection.execute(`CALL sp_approvePayment(?, ?)`, [paymentId, userInfo.fullName]);
      const affectedRows = result[0]?.[0]?.affected_rows || 0;
      
      if (affectedRows === 0) {
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
      
      // Use stored procedure to decline payment
      const [result] = await connection.execute(`CALL sp_declinePayment(?, ?, ?)`, [paymentId, userInfo.fullName, reason || 'No reason provided']);
      const affectedRows = result[0]?.[0]?.affected_rows || 0;
      
      if (affectedRows === 0) {
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
      
      if (branchFilter === null) {
        // System administrator - see all using stored procedure
        const [result] = await connection.execute(`CALL sp_getPaymentStatsAll(?)`, [month || '']);
        const stats = result[0]?.[0] || {
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
        
        return res.status(200).json({
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
      } else if (branchFilter.length === 0) {
        // No branches accessible
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
        // Filter by accessible branches using stored procedure
        const branchIdsString = branchFilter.join(',');
        const [result] = await connection.execute(`CALL sp_getPaymentStatsByBranches(?, ?)`, [branchIdsString, month || '']);
        const stats = result[0]?.[0] || {
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
        
        return res.status(200).json({
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
      }
      
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
          paymentId: paymentResult.payment_id, 
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
  },

  /**
   * Get penalty payments from penalty_payments table
   * @route GET /api/payments/penalty
   */
  getPenaltyPayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      // Get branch filter for proper multi-branch support
      const branchFilter = await getBranchFilter(req, connection);
      
      let payments;
      
      if (branchFilter === null) {
        // System admin - get all payments using view
        const [result] = await connection.query(
          `SELECT * FROM penalty_payments_view ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [limit, offset]
        );
        payments = result;
      } else if (branchFilter.length === 0) {
        // No accessible branches
        return res.status(200).json({
          success: true,
          message: 'Penalty payments retrieved successfully',
          data: []
        });
      } else {
        // Branch filtered - use view with branch filter
        const branchIds = branchFilter.join(',');
        const [result] = await connection.query(
          `SELECT * FROM penalty_payments_view WHERE FIND_IN_SET(branch_id, ?) > 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [branchIds, limit, offset]
        );
        payments = result;
      }
      
      // Map database column names to camelCase for frontend
      const formattedPayments = payments.map(p => ({
        penaltyPaymentId: p.penalty_payment_id,
        reportId: p.report_id,
        stallholderId: p.stallholder_id,
        violationId: p.violation_id,
        penaltyId: p.penalty_id,
        amount: p.amount,
        paymentDate: p.payment_date,
        paymentTime: p.payment_time,
        paymentMethod: p.payment_method,
        referenceNumber: p.reference_number,
        paymentStatus: p.payment_status,
        notes: p.notes,
        branchId: p.branch_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        stallholderName: decryptSafe(p.stallholder_name),
        stallNo: p.stall_no,
        branchName: p.branch_name,
        violationType: p.violation_type,
        ordinanceNo: p.ordinance_no,
        violationDetails: p.violation_details,
        penaltyAmount: p.penalty_amount,
        penaltyRemarks: p.penalty_remarks,
        offenseNo: p.offense_no,
        severity: p.severity,
        inspectorName: decryptSafe(p.inspector_name),
        collectedBy: decryptSafe(p.collected_by_name) || '-'
      }));
      
      return res.status(200).json({
        success: true,
        message: 'Penalty payments retrieved successfully',
        data: formattedPayments
      });
      
    } catch (error) {
      console.error('❌ Error fetching penalty payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch penalty payments',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  }
};

export default PaymentController;

