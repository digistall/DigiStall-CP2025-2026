/**
 * Session Cleanup Service
 * Automatically marks users as offline when they haven't sent a heartbeat
 * This handles cases where browser/app is closed without proper logout
 */

import { createConnection } from '../config/database.js';

// Configuration
const HEARTBEAT_TIMEOUT_MINUTES = 2;  // Mark offline after 2 minutes of no heartbeat
const CLEANUP_INTERVAL_MS = 30000;    // Run cleanup every 30 seconds

let cleanupInterval = null;

/**
 * Mark inactive users as offline
 * Checks last_activity timestamp and marks users offline if stale
 */
async function cleanupInactiveSessions() {
  let connection;
  try {
    connection = await createConnection();
    
    // Mark business users (system_administrator, business_manager, etc.) as offline
    const [businessResult] = await connection.execute(`
      UPDATE user_accounts 
      SET is_online = 0, last_logout = NOW()
      WHERE is_online = 1 
      AND last_login IS NOT NULL
      AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
    `, [HEARTBEAT_TIMEOUT_MINUTES]);
    
    // Mark mobile staff (inspector, collector) as offline
    const [staffResult] = await connection.execute(`
      UPDATE mobile_staff_sessions 
      SET is_active = 0, logout_time = NOW(), logout_reason = 'session_timeout'
      WHERE is_active = 1 
      AND last_heartbeat IS NOT NULL
      AND TIMESTAMPDIFF(MINUTE, last_heartbeat, NOW()) > ?
    `, [HEARTBEAT_TIMEOUT_MINUTES]);
    
    // Mark stallholders as offline (mobile app users)
    const [stallholderResult] = await connection.execute(`
      UPDATE stallholders 
      SET is_online = 0
      WHERE is_online = 1 
      AND last_activity IS NOT NULL
      AND TIMESTAMPDIFF(MINUTE, last_activity, NOW()) > ?
    `, [HEARTBEAT_TIMEOUT_MINUTES]);
    
    const totalCleaned = 
      (businessResult.affectedRows || 0) + 
      (staffResult.affectedRows || 0) + 
      (stallholderResult.affectedRows || 0);
    
    if (totalCleaned > 0) {
      console.log(`🧹 Session cleanup: ${totalCleaned} inactive user(s) marked offline`);
      console.log(`   - Business users: ${businessResult.affectedRows || 0}`);
      console.log(`   - Mobile staff: ${staffResult.affectedRows || 0}`);
      console.log(`   - Stallholders: ${stallholderResult.affectedRows || 0}`);
    }
    
    await connection.end();
  } catch (error) {
    // Silently handle errors - tables might not exist or have different structure
    if (connection) await connection.end().catch(() => {});
  }
}

/**
 * Start the session cleanup scheduler
 */
export function startSessionCleanup() {
  if (cleanupInterval) {
    console.log('⚠️ Session cleanup already running');
    return;
  }
  
  console.log(`🔄 Session cleanup started (timeout: ${HEARTBEAT_TIMEOUT_MINUTES}min, interval: ${CLEANUP_INTERVAL_MS/1000}s)`);
  
  // Run immediately on start
  cleanupInactiveSessions();
  
  // Then run periodically
  cleanupInterval = setInterval(cleanupInactiveSessions, CLEANUP_INTERVAL_MS);
}

/**
 * Stop the session cleanup scheduler
 */
export function stopSessionCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Session cleanup stopped');
  }
}

/**
 * Update heartbeat for a user (called from heartbeat endpoint)
 */
export async function updateUserHeartbeat(userId, userType) {
  let connection;
  try {
    connection = await createConnection();
    
    if (userType === 'inspector' || userType === 'collector') {
      // Update mobile staff session
      await connection.execute(`
        UPDATE mobile_staff_sessions 
        SET last_heartbeat = NOW()
        WHERE staff_id = ? AND is_active = 1
      `, [userId]);
    } else if (userType === 'stallholder') {
      // Update stallholder
      await connection.execute(`
        UPDATE stallholders 
        SET last_activity = NOW(), is_online = 1
        WHERE stallholder_id = ?
      `, [userId]);
    } else {
      // Update business users (system_administrator, business_manager, etc.)
      await connection.execute(`
        UPDATE user_accounts 
        SET last_login = NOW(), is_online = 1
        WHERE user_id = ?
      `, [userId]);
    }
    
    await connection.end();
    return { success: true };
  } catch (error) {
    if (connection) await connection.end().catch(() => {});
    console.error('Heartbeat update error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  startSessionCleanup,
  stopSessionCleanup,
  updateUserHeartbeat
};


