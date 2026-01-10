/**
 * Data Encryption Utility
 * Provides encryption and decryption for sensitive user data
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment or generate secure default
const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️ DATA_ENCRYPTION_KEY not set in environment. Using generated key.');
    // In production, this should always come from environment
    return crypto.scryptSync('digistall-secure-key-change-in-production', 'salt', 32);
  }
  // Derive a 32-byte key from the provided key
  return crypto.scryptSync(key, 'digistall-salt', 32);
};

/**
 * Encrypt sensitive data
 * @param {string} plainText - The data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:encryptedData (base64)
 */
export const encryptData = (plainText) => {
  if (!plainText || plainText === '') {
    return plainText;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Data in format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plaintext
 */
export const decryptData = (encryptedData) => {
  if (!encryptedData || encryptedData === '' || !encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // Data might not be encrypted, return as-is
      return encryptedData;
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    // If decryption fails, data might not be encrypted - return as-is
    return encryptedData;
  }
};

/**
 * Check if data is encrypted (has our format)
 * @param {string} data - Data to check
 * @returns {boolean}
 */
export const isEncrypted = (data) => {
  if (!data || typeof data !== 'string') return false;
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  
  try {
    // Check if parts are valid base64
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    return true;
  } catch {
    return false;
  }
};

/**
 * Hash data for comparison (one-way, cannot be reversed)
 * Use this for data you only need to compare, not retrieve
 * @param {string} plainText - Data to hash
 * @returns {string} - Hashed data (SHA-256)
 */
export const hashData = (plainText) => {
  if (!plainText || plainText === '') {
    return plainText;
  }
  return crypto.createHash('sha256').update(plainText).digest('hex');
};

/**
 * Hash data with salt for secure storage
 * @param {string} plainText - Data to hash
 * @returns {string} - Salt and hash combined
 */
export const hashWithSalt = (plainText) => {
  if (!plainText || plainText === '') {
    return plainText;
  }
  
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(salt + plainText)
    .digest('hex');
  
  return `${salt}:${hash}`;
};

/**
 * Verify hashed data with salt
 * @param {string} plainText - Original data to verify
 * @param {string} hashedData - Salt:hash format
 * @returns {boolean}
 */
export const verifyHashedData = (plainText, hashedData) => {
  if (!plainText || !hashedData || !hashedData.includes(':')) {
    return false;
  }
  
  const [salt, originalHash] = hashedData.split(':');
  const hash = crypto.createHash('sha256')
    .update(salt + plainText)
    .digest('hex');
  
  return hash === originalHash;
};

/**
 * Encrypt object fields based on configuration
 * @param {Object} data - Object with data to encrypt
 * @param {Array<string>} fieldsToEncrypt - Field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
export const encryptObjectFields = (data, fieldsToEncrypt) => {
  if (!data || typeof data !== 'object') return data;
  
  const encrypted = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptData(encrypted[field]);
    }
  }
  
  return encrypted;
};

/**
 * Decrypt object fields
 * @param {Object} data - Object with encrypted data
 * @param {Array<string>} fieldsToDecrypt - Field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
export const decryptObjectFields = (data, fieldsToDecrypt) => {
  if (!data || typeof data !== 'object') return data;
  
  const decrypted = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decryptData(decrypted[field]);
    }
  }
  
  return decrypted;
};

/**
 * List of sensitive fields that should be encrypted
 * These are fields containing PII (Personally Identifiable Information)
 */
export const SENSITIVE_FIELDS = {
  applicant: [
    'applicant_full_name',
    'applicant_first_name',
    'applicant_middle_name',
    'applicant_last_name',
    'first_name',
    'middle_name',
    'last_name',
    'applicant_address',
    'address',
    'applicant_contact_number',
    'contact_number',
    'phone_number',
    'email',
    'email_address',
    'applicant_birthdate',
    'birthdate'
  ],
  stallholder: [
    'stallholder_name',
    'contact_number',
    'email',
    'address',
    'business_name'
  ],
  employee: [
    'first_name',
    'last_name',
    'middle_name',
    'email',
    'contact_no',
    'address'
  ],
  inspector: [
    'first_name',
    'last_name',
    'email',
    'contact_no'
  ],
  collector: [
    'first_name',
    'last_name',
    'email',
    'contact_no'
  ],
  branchManager: [
    'first_name',
    'last_name',
    'email',
    'contact_number',
    'address'
  ],
  spouse: [
    'spouse_full_name',
    'spouse_contact_number',
    'spouse_occupation'
  ]
};

export default {
  encryptData,
  decryptData,
  isEncrypted,
  hashData,
  hashWithSalt,
  verifyHashedData,
  encryptObjectFields,
  decryptObjectFields,
  SENSITIVE_FIELDS
};
