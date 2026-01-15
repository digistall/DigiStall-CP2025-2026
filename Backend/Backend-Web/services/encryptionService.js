// ===== DATA ENCRYPTION UTILITY =====
// AES-256-GCM encryption/decryption for sensitive data
// 
// Format: IV:AuthTag:CipherText (Base64 encoded)
// - IV: 16 bytes initialization vector
// - AuthTag: 16 bytes authentication tag
// - CipherText: encrypted data

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'DigiStall2025SecureKeyForEncryption123';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
// Use the correct salt that was used to encrypt the data
const SALT = 'digistall-salt';

/**
 * Derive a 32-byte key from the encryption key string
 * @param {string} key - The encryption key
 * @returns {Buffer} 32-byte key
 */
function deriveKey(key) {
  return crypto.scryptSync(key, SALT, 32);
}

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string in format IV:AuthTag:CipherText
 */
export function encrypt(text) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(ENCRYPTION_KEY);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    return text; // Return original on error
  }
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param {string} encryptedText - Encrypted string in format IV:AuthTag:CipherText
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  // Check if the text looks like it's encrypted (has the IV:AuthTag:CipherText format)
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Not encrypted or different format, return as-is
    return encryptedText;
  }
  
  try {
    const [ivBase64, authTagBase64, cipherText] = parts;
    
    // Validate that all parts are valid Base64
    if (!isValidBase64(ivBase64) || !isValidBase64(authTagBase64) || !isValidBase64(cipherText)) {
      return encryptedText; // Not valid encrypted data
    }
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const key = deriveKey(ENCRYPTION_KEY);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message, 'for text:', encryptedText.substring(0, 50));
    return encryptedText; // Return original on error
  }
}

/**
 * Check if a string is valid Base64
 * @param {string} str - String to check
 * @returns {boolean} True if valid Base64
 */
function isValidBase64(str) {
  if (!str) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str);
}

/**
 * Decrypt all string fields in an object (non-recursive for flat objects)
 * @param {Object} obj - Object with potentially encrypted fields
 * @param {string[]} fieldsToDecrypt - Array of field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptObject(obj, fieldsToDecrypt = null) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  const fields = fieldsToDecrypt || Object.keys(obj);
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = decrypt(result[field]);
    }
  }
  
  return result;
}

/**
 * Decrypt an array of objects
 * @param {Object[]} arr - Array of objects
 * @param {string[]} fieldsToDecrypt - Array of field names to decrypt
 * @returns {Object[]} Array with decrypted objects
 */
export function decryptArray(arr, fieldsToDecrypt = null) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => decryptObject(item, fieldsToDecrypt));
}

/**
 * Decrypt common sensitive fields in stallholder data
 * @param {Object|Object[]} data - Stallholder data
 * @returns {Object|Object[]} Decrypted data
 */
export function decryptStallholderData(data) {
  const sensitiveFields = [
    'stallholder_name', 'contact_number', 'email', 'address',
    'business_name', 'notes', 'first_name', 'last_name'
  ];
  
  if (Array.isArray(data)) {
    return decryptArray(data, sensitiveFields);
  }
  return decryptObject(data, sensitiveFields);
}

/**
 * Decrypt common sensitive fields in employee/staff data
 * @param {Object|Object[]} data - Employee/staff data
 * @returns {Object|Object[]} Decrypted data
 */
export function decryptEmployeeData(data) {
  const sensitiveFields = [
    'first_name', 'last_name', 'email', 'contact_no', 'contact_number',
    'address', 'full_name', 'employee_name', 'inspector_name', 'collector_name'
  ];
  
  if (Array.isArray(data)) {
    return decryptArray(data, sensitiveFields);
  }
  return decryptObject(data, sensitiveFields);
}

/**
 * Decrypt common sensitive fields in applicant data
 * @param {Object|Object[]} data - Applicant data
 * @returns {Object|Object[]} Decrypted data
 */
export function decryptApplicantData(data) {
  const sensitiveFields = [
    'first_name', 'last_name', 'email', 'contact_no', 'address',
    'business_name', 'occupation', 'emergency_contact_name', 
    'emergency_contact_number', 'notes'
  ];
  
  if (Array.isArray(data)) {
    return decryptArray(data, sensitiveFields);
  }
  return decryptObject(data, sensitiveFields);
}

/**
 * Decrypt common sensitive fields in payment data
 * @param {Object|Object[]} data - Payment data
 * @returns {Object|Object[]} Decrypted data
 */
export function decryptPaymentData(data) {
  const sensitiveFields = [
    'stallholder_name', 'collected_by', 'notes', 'reference_number'
  ];
  
  if (Array.isArray(data)) {
    return decryptArray(data, sensitiveFields);
  }
  return decryptObject(data, sensitiveFields);
}

/**
 * Generic decrypt function that tries to detect and decrypt common patterns
 * @param {Object|Object[]} data - Any data that might contain encrypted fields
 * @returns {Object|Object[]} Decrypted data
 */
export function decryptData(data) {
  // Common sensitive field patterns across all entities
  const allSensitiveFields = [
    // Name fields
    'first_name', 'last_name', 'full_name', 'stallholder_name', 
    'business_name', 'employee_name', 'inspector_name', 'collector_name',
    'complainant_name', 'manager_name', 'vendor_name',
    // Contact fields
    'email', 'contact_no', 'contact_number', 'phone', 'mobile',
    'emergency_contact_name', 'emergency_contact_number',
    // Address fields
    'address', 'business_address', 'home_address',
    // Other PII
    'notes', 'remarks', 'description', 'occupation', 'reference_number'
  ];
  
  if (Array.isArray(data)) {
    return decryptArray(data, allSensitiveFields);
  }
  return decryptObject(data, allSensitiveFields);
}

export default {
  encrypt,
  decrypt,
  decryptObject,
  decryptArray,
  decryptStallholderData,
  decryptEmployeeData,
  decryptApplicantData,
  decryptPaymentData,
  decryptData
};
