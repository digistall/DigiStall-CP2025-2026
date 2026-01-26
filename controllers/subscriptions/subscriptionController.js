// ===== SUBSCRIPTION MANAGEMENT CONTROLLER =====
// System Administrator manages Stall Business Owner subscriptions

import { createConnection } from '../../config/database.js';
import { encryptData } from '../../services/encryptionService.js';
import { generateSecurePassword } from '../../utils/passwordGenerator.js';

// Get all subscription plans
export const getAllSubscriptionPlans = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const [[plans]] = await connection.execute('CALL getAllSubscriptionPlans()');
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('❌ Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Create Business Owner with Subscription
export const createBusinessOwnerWithSubscription = async (req, res) => {
  let connection;
  
  try {
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      planId
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !planId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Generate secure password
    const generatedPassword = generateSecurePassword(12);
    
    // Encrypt password and names (NOT email - needed for login search)
    const encryptedPassword = encryptData(generatedPassword);
    const encryptedFullName = encryptData(`${firstName} ${lastName}`);
    const encryptedFirstName = encryptData(firstName);
    const encryptedLastName = encryptData(lastName);
    const encryptedContact = contactNumber ? encryptData(contactNumber) : null;
    
    connection = await createConnection();
    
    // Get system admin ID from request
    const systemAdminId = req.user.userId;
    
    // Create business owner with subscription
    // Email is stored as PLAIN TEXT for login search
    const [[result]] = await connection.execute(
      'CALL createBusinessOwnerWithSubscription(?, ?, ?, ?, ?, ?, ?, ?)',
      [encryptedPassword, encryptedFullName, encryptedFirstName, encryptedLastName, email, encryptedContact, planId, systemAdminId]
    );
    
    // Return credentials to display to admin
    console.log('✅ Business Owner created:', { email, generatedPassword });
    
    res.status(201).json({
      success: true,
      message: 'Business owner created successfully. Awaiting first payment.',
      data: result[0],
      credentials: {
        email: email,
        password: generatedPassword
      }
    });
  } catch (error) {
    console.error('❌ Error creating business owner:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create business owner',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Record subscription payment
export const recordSubscriptionPayment = async (req, res) => {
  let connection;
  
  try {
    const {
      subscriptionId,
      businessOwnerId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      periodStart,
      periodEnd,
      notes
    } = req.body;
    
    // Validate required fields
    if (!subscriptionId || !businessOwnerId || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: subscriptionId, businessOwnerId, amount, paymentDate, paymentMethod'
      });
    }
    
    connection = await createConnection();
    
    // Get system admin ID from request
    const systemAdminId = req.user.userId;
    
    // Record payment
    const [[result]] = await connection.execute(
      'CALL recordSubscriptionPayment(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        subscriptionId,
        businessOwnerId,
        amount,
        paymentDate,
        paymentMethod,
        referenceNumber || null,
        periodStart,
        periodEnd,
        notes || null,
        systemAdminId
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get all business owners with subscription status
export const getAllBusinessOwnersWithSubscription = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const [[businessOwners]] = await connection.execute(
      'CALL getAllBusinessOwnersWithSubscription()'
    );
    
    // Decrypt sensitive fields and add monthly_fee
    const { decryptData } = await import('../../services/encryptionService.js');
    const decryptedOwners = businessOwners.map(owner => ({
      ...owner,
      full_name: decryptData(owner.owner_full_name),
      contact_number: decryptData(owner.contact_number),
      monthly_fee: owner.plan_price
    }));
    
    res.status(200).json({
      success: true,
      data: decryptedOwners
    });
  } catch (error) {
    console.error('❌ Error fetching business owners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business owners',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get business owner subscription details
export const getBusinessOwnerSubscription = async (req, res) => {
  let connection;
  
  try {
    const { businessOwnerId } = req.params;
    
    connection = await createConnection();
    
    const [[subscription]] = await connection.execute(
      'CALL getBusinessOwnerSubscription(?)',
      [businessOwnerId]
    );
    
    if (!subscription || subscription.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for this business owner'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription[0]
    });
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get payment history for a business owner
export const getBusinessOwnerPaymentHistory = async (req, res) => {
  let connection;
  
  try {
    const { businessOwnerId } = req.params;
    
    connection = await createConnection();
    
    const [[payments]] = await connection.execute(
      'CALL getBusinessOwnerPaymentHistory(?)',
      [businessOwnerId]
    );
    
    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get dashboard statistics for System Administrator
export const getSystemAdminDashboardStats = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    const [results] = await connection.execute('CALL getSystemAdminDashboardStats()');
    
    // Extract values from single result set
    const row = results[0][0];
    const stats = {
      totalBusinessOwners: row.total_business_owners || 0,
      activeSubscriptions: row.active_subscriptions || 0,
      pendingSubscriptions: row.pending_subscriptions || 0,
      pendingPayments: row.pending_payments || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalBranches: row.total_branches || 0,
      availableStalls: row.available_stalls || 0,
      occupiedStalls: row.occupied_stalls || 0
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};
