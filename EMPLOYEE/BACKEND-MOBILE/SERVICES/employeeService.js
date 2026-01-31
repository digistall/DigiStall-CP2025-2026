/**
 * EMPLOYEE - Mobile Backend Services
 * Employee-related services for mobile (Inspector/Collector)
 */

import { createConnection } from '../../../CONFIG/database.js';
import { decryptAES256GCM } from '../../../SERVICES/mysqlDecryptionService.js';
import { encryptData, decryptData, decryptInspectors, decryptCollectors } from '../../../SERVICES/encryptionService.js';

/**
 * Get stallholders by branch with decryption
 * @param {number} branchId - Branch ID
 * @returns {Array} List of decrypted stallholders
 */
export const getStallholdersByBranch = async (branchId) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      'CALL getStallholdersByBranchDecrypted(?)',
      [branchId]
    );
    
    const stallholders = results[0] || [];
    return stallholders.map(sh => decryptStallholderFields(sh));
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Decrypt stallholder sensitive fields
 * @param {Object} stallholder - Stallholder data
 * @returns {Object} Stallholder with decrypted fields
 */
export const decryptStallholderFields = (stallholder) => {
  try {
    return {
      ...stallholder,
      full_name: stallholder.full_name ? decryptAES256GCM(stallholder.full_name) : null,
      email: stallholder.email ? decryptAES256GCM(stallholder.email) : null,
      contact_number: stallholder.contact_number ? decryptAES256GCM(stallholder.contact_number) : null,
      address: stallholder.address ? decryptAES256GCM(stallholder.address) : null,
    };
  } catch (error) {
    console.error('Error decrypting stallholder fields:', error);
    return stallholder;
  }
};

/**
 * Get inspector by ID
 * @param {number} inspectorId - Inspector ID
 * @returns {Object|null} Inspector data
 */
export const getInspectorById = async (inspectorId) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      'SELECT * FROM inspectors WHERE inspector_id = ?',
      [inspectorId]
    );
    return results.length > 0 ? decryptInspectors([results[0]])[0] : null;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get collector by ID
 * @param {number} collectorId - Collector ID
 * @returns {Object|null} Collector data
 */
export const getCollectorById = async (collectorId) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(
      'SELECT * FROM collectors WHERE collector_id = ?',
      [collectorId]
    );
    return results.length > 0 ? decryptCollectors([results[0]])[0] : null;
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getStallholdersByBranch,
  decryptStallholderFields,
  getInspectorById,
  getCollectorById
};
