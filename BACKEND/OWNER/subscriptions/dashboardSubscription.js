import { createConnection } from '../../../config/database.js';
import { decryptData } from '../../../services/encryptionService.js';

/**
 * Dashboard Subscription Controller
 * Uses Server-Sent Events (SSE) to push updates to the dashboard
 * instead of continuous polling
 */

// Store active SSE connections per user
const activeConnections = new Map();

// Store the last data hash for each data type to detect changes
const lastDataHashes = new Map();

/**
 * Calculate a simple hash of data to detect changes
 */
function calculateHash(data) {
  return JSON.stringify(data).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString();
}

/**
 * SSE endpoint for dashboard subscriptions
 * Sends updates only when data changes in the database
 */
export const subscribeToDashboard = async (req, res) => {
  const userId = req.user?.userId || 'anonymous';
  const connectionId = `${userId}-${Date.now()}`;
  

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ connectionId, timestamp: new Date().toISOString() })}\n\n`);

  // Store this connection
  activeConnections.set(connectionId, { res, userId, lastCheck: Date.now() });

  // Function to check for changes and send updates
  const checkForChanges = async () => {
    let connection;
    try {
      connection = await createConnection();
      
      const updates = {};
      let hasChanges = false;

      // Check stalls data
      const [stallsData] = await connection.execute(`
        SELECT 
          COUNT(s.stall_id) as total,
          SUM(CASE WHEN sh.stallholder_id IS NOT NULL THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN sh.stallholder_id IS NULL THEN 1 ELSE 0 END) as vacant
        FROM stall s
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.status = 'Active'
        WHERE s.branch_id = ?
      `, [req.user?.branchId || 1]);
      
      const stallsHash = calculateHash(stallsData);
      if (lastDataHashes.get(`${connectionId}-stalls`) !== stallsHash) {
        updates.stalls = stallsData[0];
        lastDataHashes.set(`${connectionId}-stalls`, stallsHash);
        hasChanges = true;
      }

      // Check stallholders count
      const [stallholdersData] = await connection.execute(`
        SELECT COUNT(DISTINCT stallholder_id) as total
        FROM stallholder 
        WHERE status = 'Active' 
        AND branch_id = ?
      `, [req.user?.branchId || 1]);
      
      const stallholdersHash = calculateHash(stallholdersData);
      if (lastDataHashes.get(`${connectionId}-stallholders`) !== stallholdersHash) {
        updates.stallholders = stallholdersData[0];
        lastDataHashes.set(`${connectionId}-stallholders`, stallholdersHash);
        hasChanges = true;
      }

      // Check payments data
      const [regPayments] = await connection.execute(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as amt
        FROM payments 
        WHERE DATE(payment_date) = CURDATE() AND branch_id = ?
      `, [req.user?.branchId || 1]);
      
      const [penPayments] = await connection.execute(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(pp.amount), 0) as amt
        FROM penalty_payments pp
        JOIN stallholder sh ON pp.stallholder_id = sh.stallholder_id
        WHERE DATE(pp.payment_date) = CURDATE() AND sh.branch_id = ?
      `, [req.user?.branchId || 1]);
      
      const paymentsData = [{
        totalPayments: parseInt(regPayments[0].cnt) + parseInt(penPayments[0].cnt),
        totalAmount: parseFloat(regPayments[0].amt) + parseFloat(penPayments[0].amt)
      }];
      
      const paymentsHash = calculateHash(paymentsData);
      if (lastDataHashes.get(`${connectionId}-payments`) !== paymentsHash) {
        updates.payments = paymentsData[0];
        lastDataHashes.set(`${connectionId}-payments`, paymentsHash);
        hasChanges = true;
      }

      // Check recent payments (last 5)
      const [regularPayments] = await connection.execute(`
        SELECT 
          p.payment_id,
          p.amount as amount_paid,
          p.payment_date,
          p.payment_method,
          p.payment_type,
          p.payment_status,
          s.full_name as stallholder_name,
          st.stall_number,
          p.created_at
        FROM payments p
        LEFT JOIN stallholder s ON p.stallholder_id = s.stallholder_id
        LEFT JOIN stall st ON s.stall_id = st.stall_id
        WHERE p.branch_id = ?
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT 5
      `, [req.user?.branchId || 1]);
      
      const [penaltyPayments] = await connection.execute(`
        SELECT 
          pp.penalty_payment_id as payment_id,
          pp.amount as amount_paid,
          pp.payment_date,
          pp.payment_method,
          'penalty' as payment_type,
          'completed' as payment_status,
          s.full_name as stallholder_name,
          st.stall_number,
          pp.created_at
        FROM penalty_payments pp
        LEFT JOIN stallholder s ON pp.stallholder_id = s.stallholder_id
        LEFT JOIN stall st ON s.stall_id = st.stall_id
        WHERE s.branch_id = ?
        ORDER BY pp.payment_date DESC, pp.created_at DESC
        LIMIT 5
      `, [req.user?.branchId || 1]);
      
      const recentPayments = [...regularPayments, ...penaltyPayments]
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date) || new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      // Decrypt stallholder names if encrypted, and enforce unique key
      const decryptedPayments = recentPayments.map(payment => {
        payment.unique_id = `${payment.payment_type}_${payment.payment_id}`;
        if (payment.stallholder_name && typeof payment.stallholder_name === 'string' && payment.stallholder_name.includes(':')) {
          try {
            payment.stallholder_name = decryptData(payment.stallholder_name);
          } catch (error) {
            console.error(`Failed to decrypt stallholder name for payment ID ${payment.payment_id}:`, error.message);
            // Keep encrypted name if decryption fails
          }
        }
        return payment;
      });
      
      const recentPaymentsHash = calculateHash(decryptedPayments);
      if (lastDataHashes.get(`${connectionId}-recentPayments`) !== recentPaymentsHash) {
        updates.recentPayments = decryptedPayments;
        lastDataHashes.set(`${connectionId}-recentPayments`, recentPaymentsHash);
        hasChanges = true;
      }

      // Check active employees/sessions
      const [sessionsData] = await connection.execute(`
        SELECT COUNT(*) as activeCount
        FROM staff_session 
        WHERE is_active = 1
      `);
      
      const sessionsHash = calculateHash(sessionsData);
      if (lastDataHashes.get(`${connectionId}-sessions`) !== sessionsHash) {
        updates.activeSessions = sessionsData[0];
        lastDataHashes.set(`${connectionId}-sessions`, sessionsHash);
        hasChanges = true;
      }

      // Only send update if there are changes
      if (hasChanges) {
        res.write(`event: update\ndata: ${JSON.stringify({ 
          timestamp: new Date().toISOString(),
          updates 
        })}\n\n`);
      }

    } catch (error) {
      if (error.code !== 'ETIMEDOUT') {
        console.error(`❌ Error checking dashboard data: ${error.message}`);
      }
      // Don't close connection on error, just skip this check
    } finally {
      if (connection) await connection.end();
    }
  };

  // Initial data push
  await checkForChanges();

  // Set up interval to check for changes every 5 seconds
  // This is much more efficient than the frontend polling every 2 seconds
  const intervalId = setInterval(checkForChanges, 5000);

  // Handle connection close
  req.on('close', () => {
    clearInterval(intervalId);
    activeConnections.delete(connectionId);
    
    // Clean up data hashes for this connection
    for (const key of lastDataHashes.keys()) {
      if (key.startsWith(connectionId)) {
        lastDataHashes.delete(key);
      }
    }
  });

  // Handle errors
  req.on('error', (err) => {
    console.error(`❌ SSE connection error: ${err.message}`);
    clearInterval(intervalId);
    activeConnections.delete(connectionId);
  });
};

/**
 * Trigger a manual update for all connected dashboard clients
 * Can be called when data changes (e.g., after a payment is made)
 */
export const triggerDashboardUpdate = async (updateType = 'all') => {
  
  // For each active connection, clear the relevant hash to force an update
  for (const [connectionId, connection] of activeConnections) {
    if (updateType === 'all') {
      // Clear all hashes for this connection
      for (const key of lastDataHashes.keys()) {
        if (key.startsWith(connectionId)) {
          lastDataHashes.delete(key);
        }
      }
    } else {
      // Clear specific hash
      lastDataHashes.delete(`${connectionId}-${updateType}`);
    }
  }
};

/**
 * Get count of active dashboard connections
 */
export const getActiveConnectionsCount = () => {
  return activeConnections.size;
};

export default {
  subscribeToDashboard,
  triggerDashboardUpdate,
  getActiveConnectionsCount
};

