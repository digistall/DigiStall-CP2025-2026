import { createConnection } from '../../CONFIG/database.js';

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
  
  console.log(`📡 Dashboard SSE connection opened: ${connectionId}`);

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
          COUNT(*) as total,
          SUM(CASE WHEN stallholder_id IS NOT NULL AND status = 'Active' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN stallholder_id IS NULL OR status != 'Active' THEN 1 ELSE 0 END) as vacant
        FROM stall 
        WHERE branch_id = (SELECT branch_id FROM business_employee WHERE business_employee_id = ? LIMIT 1)
      `, [req.user?.userId || 1]);
      
      const stallsHash = calculateHash(stallsData);
      if (lastDataHashes.get(`${connectionId}-stalls`) !== stallsHash) {
        updates.stalls = stallsData[0];
        lastDataHashes.set(`${connectionId}-stalls`, stallsHash);
        hasChanges = true;
      }

      // Check stallholders count
      const [stallholdersData] = await connection.execute(`
        SELECT COUNT(DISTINCT stallholder_id) as total
        FROM stall 
        WHERE stallholder_id IS NOT NULL 
        AND branch_id = (SELECT branch_id FROM business_employee WHERE business_employee_id = ? LIMIT 1)
      `, [req.user?.userId || 1]);
      
      const stallholdersHash = calculateHash(stallholdersData);
      if (lastDataHashes.get(`${connectionId}-stallholders`) !== stallholdersHash) {
        updates.stallholders = stallholdersData[0];
        lastDataHashes.set(`${connectionId}-stallholders`, stallholdersHash);
        hasChanges = true;
      }

      // Check payments data
      const [paymentsData] = await connection.execute(`
        SELECT 
          COUNT(*) as totalPayments,
          COALESCE(SUM(amount_paid), 0) as totalAmount
        FROM payment 
        WHERE DATE(payment_date) = CURDATE()
        AND branch_id = (SELECT branch_id FROM business_employee WHERE business_employee_id = ? LIMIT 1)
      `, [req.user?.userId || 1]);
      
      const paymentsHash = calculateHash(paymentsData);
      if (lastDataHashes.get(`${connectionId}-payments`) !== paymentsHash) {
        updates.payments = paymentsData[0];
        lastDataHashes.set(`${connectionId}-payments`, paymentsHash);
        hasChanges = true;
      }

      // Check recent payments (last 5)
      const [recentPayments] = await connection.execute(`
        SELECT 
          p.payment_id,
          p.amount_paid,
          p.payment_date,
          p.payment_method,
          s.full_name as stallholder_name,
          st.stall_number
        FROM payment p
        LEFT JOIN stallholder s ON p.stallholder_id = s.stallholder_id
        LEFT JOIN stall st ON p.stall_id = st.stall_id
        WHERE p.branch_id = (SELECT branch_id FROM business_employee WHERE business_employee_id = ? LIMIT 1)
        ORDER BY p.payment_date DESC
        LIMIT 5
      `, [req.user?.userId || 1]);
      
      const recentPaymentsHash = calculateHash(recentPayments);
      if (lastDataHashes.get(`${connectionId}-recentPayments`) !== recentPaymentsHash) {
        updates.recentPayments = recentPayments;
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
        console.log(`📤 Sending dashboard update to ${connectionId}`);
        res.write(`event: update\ndata: ${JSON.stringify({ 
          timestamp: new Date().toISOString(),
          updates 
        })}\n\n`);
      }

    } catch (error) {
      console.error(`❌ Error checking dashboard data: ${error.message}`);
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
    console.log(`📡 Dashboard SSE connection closed: ${connectionId}`);
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
  console.log(`📢 Triggering dashboard update for: ${updateType}`);
  
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

