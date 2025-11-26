// ===== SUBSCRIPTION MANAGEMENT CONTROLLER =====
// System Administrator manages Stall Business Owner subscriptions

import { createConnection } from '../../config/database.js';
import bcrypt from 'bcrypt';

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
      username,
      password,
      firstName,
      lastName,
      email,
      contactNumber,
      planId
    } = req.body;
    
    // Validate required fields
    if (!username || !password || !firstName || !lastName || !email || !planId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    connection = await createConnection();
    
    // Get system admin ID from request
    const systemAdminId = req.user.userId;
    
    // Create business owner with subscription
    const [[result]] = await connection.execute(
      'CALL createBusinessOwnerWithSubscription(?, ?, ?, ?, ?, ?, ?, ?)',
      [username, passwordHash, firstName, lastName, email, contactNumber, planId, systemAdminId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Business owner created successfully. Awaiting first payment.',
      data: result[0]
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
    
    res.status(200).json({
      success: true,
      data: businessOwners
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
    
    // Extract values from result sets
    const stats = {
      totalBusinessOwners: results[0][0].total_business_owners,
      activeSubscriptions: results[1][0].active_subscriptions,
      expiringSoon: results[2][0].expiring_soon,
      expiredSubscriptions: results[3][0].expired_subscriptions,
      revenueThisMonth: parseFloat(results[4][0].revenue_this_month),
      totalRevenue: parseFloat(results[5][0].total_revenue),
      pendingPayments: results[6][0].pending_payments
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
