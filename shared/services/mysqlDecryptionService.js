// ===== MYSQL DECRYPTION SERVICE =====
// Database-level decryption service using MySQL-compatible encryption

import { createConnection } from '../CONFIG/database.js';
import crypto from 'crypto';

// Cache for encryption key
let cachedKey = null;
let keyFetchedAt = null;
const KEY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get encryption key from database
 */
export async function getEncryptionKeyFromDB() {
  // Return cached key if still valid
  if (cachedKey && keyFetchedAt && (Date.now() - keyFetchedAt < KEY_CACHE_DURATION)) {
    return cachedKey;
  }
  
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['encryption_key']
    );
    
    if (rows.length > 0) {
      cachedKey = rows[0].setting_value;
      keyFetchedAt = Date.now();
      return cachedKey;
    }
    
    // Fallback to env variable
    cachedKey = process.env.ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY;
    keyFetchedAt = Date.now();
    return cachedKey;
  } catch (error) {
    console.error('Error fetching encryption key:', error);
    // Fallback to env variable
    return process.env.ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY;
  } finally {
    await connection.end();
  }
}

/**
 * Decrypt using AES-256-GCM (MySQL compatible)
 */
export function decryptAES256GCM(encryptedText, key) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  try {
    // Format: iv:authTag:encrypted
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Try simple AES-256-CBC format
      return decryptAES256CBC(encryptedText, key);
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', 
      Buffer.from(key).slice(0, 32), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('AES-256-GCM decryption error:', error.message);
    return encryptedText;
  }
}

/**
 * Decrypt using AES-256-CBC
 */
export function decryptAES256CBC(encryptedText, key) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('AES-256-CBC decryption error:', error.message);
    return encryptedText;
  }
}

// Sensitive fields for various entity types
const SENSITIVE_FIELDS = {
  applicant: ['first_name', 'last_name', 'middle_name', 'email', 'phone', 'address', 'birthdate'],
  stallholder: ['first_name', 'last_name', 'middle_name', 'email', 'contact_number', 'address'],
  spouse: ['first_name', 'last_name', 'middle_name', 'birthdate'],
  staff: ['first_name', 'last_name', 'middle_name', 'email', 'phone', 'address']
};

/**
 * Decrypt object fields
 */
export function decryptObjectFields(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const allSensitiveFields = fields.length > 0 ? fields : 
    [...SENSITIVE_FIELDS.applicant, ...SENSITIVE_FIELDS.stallholder, 
     ...SENSITIVE_FIELDS.spouse, ...SENSITIVE_FIELDS.staff];
  
  const decrypted = { ...obj };
  const key = process.env.ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY;
  
  for (const field of allSensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        const decryptedValue = decryptAES256CBC(decrypted[field], key);
        if (decryptedValue !== decrypted[field]) {
          decrypted[field] = decryptedValue;
        }
      } catch (e) {
        // Keep original value if decryption fails
      }
    }
  }
  return decrypted;
}

/**
 * Decrypt applicant data
 */
export function decryptApplicantData(applicant) {
  return decryptObjectFields(applicant, SENSITIVE_FIELDS.applicant);
}

/**
 * Decrypt stallholder data
 */
export function decryptStallholderData(stallholder) {
  return decryptObjectFields(stallholder, SENSITIVE_FIELDS.stallholder);
}

/**
 * Decrypt spouse data
 */
export function decryptSpouseData(spouse) {
  return decryptObjectFields(spouse, SENSITIVE_FIELDS.spouse);
}

/**
 * Decrypt staff data
 */
export function decryptStaffData(staff) {
  return decryptObjectFields(staff, SENSITIVE_FIELDS.staff);
}

export default {
  getEncryptionKeyFromDB,
  decryptAES256GCM,
  decryptAES256CBC,
  decryptObjectFields,
  decryptApplicantData,
  decryptStallholderData,
  decryptSpouseData,
  decryptStaffData
};
