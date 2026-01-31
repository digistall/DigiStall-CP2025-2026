/**
 * MySQL Decryption Service (Mobile Backend)
 * 
 * This service handles decryption of data encrypted using AES-256-GCM.
 * Format: iv:authTag:ciphertext (all in base64)
 * 
 * The encryption key is derived using scrypt with a fixed salt.
 */

import crypto from 'crypto';
import { createConnection } from '../CONFIG/database.js';

// Cache the encryption key to avoid repeated database queries
let cachedKey = null;
let keyFetchedAt = null;
const KEY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache the derived AES-256-GCM key
let cachedAESKey = null;

/**
 * Get the AES-256-GCM encryption key using scrypt derivation
 * Matches the Web backend's encryption method
 */
const getAES256GCMKey = () => {
    if (!cachedAESKey) {
        const envKey = process.env.DATA_ENCRYPTION_KEY || 'DigiStall2025SecureKeyForEncryption123';
        cachedAESKey = crypto.scryptSync(envKey, 'digistall-salt-v2', 32);
    }
    return cachedAESKey;
};

/**
 * Decrypt AES-256-GCM encrypted data
 * Format: iv:authTag:ciphertext (all in base64)
 * @param {string} encryptedData - The encrypted string in iv:authTag:ciphertext format
 * @returns {string} - Decrypted plaintext or original if not encrypted/decryption fails
 */
export const decryptAES256GCM = (encryptedData) => {
    if (!encryptedData || typeof encryptedData !== 'string' || !encryptedData.includes(':')) {
        return encryptedData;
    }
    
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        return encryptedData;
    }
    
    try {
        const [ivBase64, authTagBase64, encrypted] = parts;
        const key = getAES256GCMKey();
        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('❌ AES-256-GCM decryption error:', error.message);
        return encryptedData;
    }
};

/**
 * Check if a string looks like AES-256-GCM encrypted data
 * @param {string} value - The value to check
 * @returns {boolean} - True if it looks like encrypted data
 */
export const isAES256GCMEncrypted = (value) => {
    if (!value || typeof value !== 'string') return false;
    const parts = value.split(':');
    // AES-256-GCM format: iv:authTag:ciphertext (all base64)
    if (parts.length !== 3) return false;
    // Check if parts look like base64
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return parts.every(part => base64Regex.test(part));
};

/**
 * Decrypt all AES-256-GCM encrypted fields in an object
 * @param {Object} data - The data object
 * @param {Array<string>} fieldsToDecrypt - List of field names to attempt decryption
 * @returns {Object} - Object with decrypted fields
 */
export const decryptObjectFields = (data, fieldsToDecrypt = []) => {
    if (!data || typeof data !== 'object') return data;
    
    const result = { ...data };
    
    const defaultFields = [
        'full_name', 'applicant_full_name', 'stallholder_name', 
        'first_name', 'last_name', 'middle_name',
        'contact_number', 'applicant_contact_number', 'stallholder_contact', 'contact_no',
        'email', 'email_address', 'stallholder_email',
        'address', 'applicant_address', 'stallholder_address',
        'spouse_full_name', 'spouse_contact_number'
    ];
    
    const allFields = [...new Set([...defaultFields, ...fieldsToDecrypt])];
    
    for (const field of allFields) {
        if (result[field] && isAES256GCMEncrypted(result[field])) {
            const decrypted = decryptAES256GCM(result[field]);
            if (decrypted !== result[field]) {
                console.log(`🔓 Decrypted ${field}: ${decrypted}`);
                result[field] = decrypted;
            }
        }
    }
    
    return result;
};

/**
 * Fetch the encryption key from the database
 * @returns {Promise<string|null>} The encryption key or null if not found
 */
export const getEncryptionKeyFromDB = async () => {
  // Return cached key if still valid
  if (cachedKey && keyFetchedAt && (Date.now() - keyFetchedAt) < KEY_CACHE_DURATION) {
    return cachedKey;
  }

  let connection;
  try {
    connection = await createConnection();
    const [rows] = await connection.execute(
      'SELECT encryption_key FROM encryption_keys WHERE key_name = ? AND is_active = 1 LIMIT 1',
      ['user_data_key']
    );
    
    if (rows && rows.length > 0) {
      cachedKey = rows[0].encryption_key;
      keyFetchedAt = Date.now();
      console.log('🔑 Encryption key loaded from database');
      return cachedKey;
    }
    
    console.warn('⚠️ No active encryption key found in database');
    return null;
  } catch (error) {
    console.error('❌ Error fetching encryption key:', error.message);
    return null;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Decrypt staff data (inspector/collector) after login
 * Uses AES-256-GCM decryption
 * @param {Object} staffData - Staff data from database
 * @returns {Promise<Object>} - Staff data with decrypted names
 */
export const decryptStaffData = async (staffData) => {
  if (!staffData) return staffData;
  
  console.log('🔓 Decrypting staff data (AES-256-GCM)...');
  return decryptObjectFields(staffData, ['first_name', 'last_name', 'middle_name', 'contact_no']);
};

/**
 * Decrypt applicant data after login
 * Uses AES-256-GCM decryption
 * @param {Object} applicantData - Applicant/credential data from database
 * @returns {Promise<Object>} - Data with decrypted fields
 */
export const decryptApplicantData = async (applicantData) => {
  if (!applicantData) return applicantData;
  
  console.log('🔓 Decrypting applicant data (AES-256-GCM)...');
  return decryptObjectFields(applicantData);
};

/**
 * Decrypt stallholder data
 * Uses AES-256-GCM decryption
 * @param {Object} stallholderData - Stallholder data from database
 * @returns {Promise<Object>} - Data with decrypted fields
 */
export const decryptStallholderData = async (stallholderData) => {
  if (!stallholderData) return stallholderData;
  
  console.log('🔓 Decrypting stallholder data (AES-256-GCM)...');
  return decryptObjectFields(stallholderData);
};

/**
 * Decrypt spouse data
 * Uses AES-256-GCM decryption
 * @param {Object} spouseData - Spouse data from database
 * @returns {Promise<Object>} - Data with decrypted fields
 */
export const decryptSpouseData = async (spouseData) => {
  if (!spouseData) return spouseData;
  
  console.log('🔓 Decrypting spouse data (AES-256-GCM)...');
  return decryptObjectFields(spouseData, ['spouse_full_name', 'spouse_contact_number']);
};

export default {
  getEncryptionKeyFromDB,
  decryptAES256GCM,
  isAES256GCMEncrypted,
  decryptObjectFields,
  decryptStaffData,
  decryptApplicantData,
  decryptStallholderData,
  decryptSpouseData
};


