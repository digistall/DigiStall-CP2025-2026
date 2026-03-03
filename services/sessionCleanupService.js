/**
 * Session Cleanup Service
 * Automatically marks users as offline when they haven't sent a heartbeat.
 * This handles cases where browser/app is closed without proper logout
 * (e.g., force close, crash, network disconnection).
 * 
 * The heartbeat handler sets is_online = 1 and updates last_login on each ping.
 * This cleanup checks last_login and marks users offline if stale.
 */

import { createConnection } from '../config/database.js';

// Configuration
const HEARTBEAT_TIMEOUT_MINUTES = 2;  // Mark offline after 2 minutes of no heartbeat
const CLEANUP_INTERVAL_MS = 30000;    // Run cleanup every 30 seconds

let cleanupInterval = null;

/**
 * Mark inactive users as offline
 * Checks last_login timestamp and marks users offline if stale.
 * Targets the actual user tables that the heartbeat endpoint updates.
 */
async function cleanupInactiveSessions() {
  let connection;
  try {
    connection = await createConnection();
    
    // Set session timezone to Philippine time for consistent comparison
    await connection.execute(`SET time_zone = '+08:00'`);
    
    let totalCleaned = 0;

    // --- Business Employee ---
    try {
      const [result] = await connection.execute(`
        UPDATE business_employee 
        SET is_online = 0
        WHERE is_online = 1 
        AND last_login IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      totalCleaned += (result.affectedRows || 0);
      if (result.affectedRows > 0) console.log(`🧹 Marked ${result.affectedRows} business_employee(s) offline`);
    } catch (e) { /* Table or column may not exist */ }

    // --- Business Manager ---
    try {
      const [result] = await connection.execute(`
        UPDATE business_manager 
        SET is_online = 0
        WHERE is_online = 1 
        AND last_login IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      totalCleaned += (result.affectedRows || 0);
      if (result.affectedRows > 0) console.log(`🧹 Marked ${result.affectedRows} business_manager(s) offline`);
    } catch (e) { /* Table or column may not exist */ }

    // --- Stall Business Owner ---
    try {
      const [result] = await connection.execute(`
        UPDATE stall_business_owner 
        SET is_online = 0
        WHERE is_online = 1 
        AND last_login IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      totalCleaned += (result.affectedRows || 0);
      if (result.affectedRows > 0) console.log(`🧹 Marked ${result.affectedRows} stall_business_owner(s) offline`);
    } catch (e) { /* Table or column may not exist */ }

    // --- System Administrator ---
    try {
      const [result] = await connection.execute(`
        UPDATE system_administrator 
        SET is_online = 0
        WHERE is_online = 1 
        AND last_login IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      totalCleaned += (result.affectedRows || 0);
      if (result.affectedRows > 0) console.log(`🧹 Marked ${result.affectedRows} system_administrator(s) offline`);
    } catch (e) { /* Table or column may not exist */ }

    // --- Inspector (mobile staff) ---
    try {
      const [result] = await connection.execute(`
        UPDATE inspector 
        SET is_online = 0
        WHERE is_online = 1 
        AND last_login IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      totalCleaned += (result.affectedRows || 0);
      if (result.affectedRows > 0) console.log(`🧹 Marked ${result.affectedRows} inspector(s) offline`);
    } catch (e) { /* Table or column may not exist */ }

    // --- Collector (mobile staff) ---
    try {
      const [result] = await connection.execute(`
        UPDATE collector 
        SET is_online = 0
        WHERE is_online = 1 
        AND last_login IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      totalCleaned += (result.affectedRows || 0);
      if (result.affectedRows > 0) console.log(`🧹 Marked ${result.affectedRows} collector(s) offline`);
    } catch (e) { /* Table or column may not exist */ }

    // --- Deactivate stale mobile staff_session entries ---
    try {
      const [result] = await connection.execute(`
        UPDATE staff_session 
        SET is_active = 0, logout_time = NOW()
        WHERE is_active = 1 
        AND last_activity IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_activity, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      if (result.affectedRows > 0) console.log(`🧹 Deactivated ${result.affectedRows} stale staff_session(s)`);
    } catch (e) { /* Table may not exist */ }

    // --- Deactivate stale employee_session entries ---
    try {
      const [result] = await connection.execute(`
        UPDATE employee_session 
        SET is_active = 0, logout_time = NOW()
        WHERE is_active = 1 
        AND last_heartbeat IS NOT NULL
        AND TIMESTAMPDIFF(MINUTE, last_heartbeat, NOW()) > ?
      `, [HEARTBEAT_TIMEOUT_MINUTES]);
      if (result.affectedRows > 0) console.log(`🧹 Deactivated ${result.affectedRows} stale employee_session(s)`);
    } catch (e) { /* Table may not exist */ }
    
    if (totalCleaned > 0) {
      console.log(`🧹 Session cleanup total: ${totalCleaned} inactive user(s) marked offline`);
    }
    
    await connection.end();
  } catch (error) {
    // Silently handle connection errors
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

export default {
  startSessionCleanup,
  stopSessionCleanup
};


