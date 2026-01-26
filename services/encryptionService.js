/**
 * AES-256-GCM Data Encryption Service
 * 
 * This service provides proper encryption/decryption for sensitive data:
 * - Names, addresses, emails, contact numbers for all users
 * - Applicants, Stallholders, Inspectors, Collectors, Employees, Managers, Spouses
 * 
 * Format: iv:authTag:encryptedData (all base64 encoded)
 */

import crypto from 'crypto';

// ===============================================
// ENCRYPTION CONFIGURATION
// ===============================================
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16;  // 16 bytes authentication tag
const KEY_LENGTH = 32;       // 32 bytes = 256 bits

/**
 * Get the encryption key from environment or generate a consistent one
 * IMPORTANT: Store DATA_ENCRYPTION_KEY in .env file
 */
const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️ DATA_ENCRYPTION_KEY not set in environment! Using default key.');
    // Default key for development - CHANGE IN PRODUCTION!
    return crypto.scryptSync('DigiStall2025SecureKeyForEncryption123', 'digistall-salt-v2', KEY_LENGTH);
  }
  // Derive a proper 256-bit key from the environment key
  return crypto.scryptSync(key, 'digistall-salt-v2', KEY_LENGTH);
};

// Cache the key to avoid repeated derivation
let cachedKey = null;
const getKey = () => {
  if (!cachedKey) {
    cachedKey = getEncryptionKey();
  }
  return cachedKey;
};

// ===============================================
// CORE ENCRYPTION/DECRYPTION FUNCTIONS
// ===============================================

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} plainText - Data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:encrypted (base64)
 */
export const encryptData = (plainText) => {
  // Handle null, undefined, or empty string
  if (plainText === null || plainText === undefined || plainText === '') {
    return plainText;
  }
  
  // Convert to string if not already
  const text = String(plainText);
  
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    // Return original data if encryption fails
    return plainText;
  }
};

/**
 * Decrypt encrypted data using AES-256-GCM
 * @param {string} encryptedData - Data in format: iv:authTag:encrypted
 * @returns {string} - Decrypted plain text
 */
export const decryptData = (encryptedData) => {
  // Handle null, undefined, or empty string
  if (encryptedData === null || encryptedData === undefined || encryptedData === '') {
    return encryptedData;
  }
  
  // If not a string, return as-is
  if (typeof encryptedData !== 'string') {
    return encryptedData;
  }
  
  // Check if data looks encrypted (has our format with 2 colons)
  if (!encryptedData.includes(':')) {
    // Not encrypted, return as-is
    return encryptedData;
  }
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // Doesn't match our format, might be plain text with colons
    return encryptedData;
  }
  
  try {
    const [ivBase64, authTagBase64, encrypted] = parts;
    
    const key = getKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Validate IV and authTag lengths
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      // Invalid format, return as-is
      return encryptedData;
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Decryption failed - data might not be encrypted or uses different key
    // Return as-is (might be plain text)
    console.log('ℹ️ Data not encrypted or different format, returning as-is');
    return encryptedData;
  }
};

/**
 * Check if data appears to be encrypted in our format
 * @param {string} data - Data to check
 * @returns {boolean}
 */
export const isEncrypted = (data) => {
  if (!data || typeof data !== 'string') return false;
  
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
};

// ===============================================
// PASSWORD HASHING (ONE-WAY)
// ===============================================

/**
 * Hash a password using SHA-256 (for database storage)
 * Matches MySQL SHA2(password, 256) function
 * @param {string} password - Plain text password
 * @returns {string} - SHA-256 hash in hex format
 */
export const hashPassword = (password) => {
  if (!password) return password;
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - SHA-256 hash to compare
 * @returns {boolean}
 */
export const verifyPassword = (password, hash) => {
  if (!password || !hash) return false;
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
};

// ===============================================
// OBJECT FIELD ENCRYPTION/DECRYPTION
// ===============================================

/**
 * Encrypt specific fields in an object
 * @param {Object} data - Object with data to encrypt
 * @param {Array<string>} fieldsToEncrypt - Field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
export const encryptObjectFields = (data, fieldsToEncrypt) => {
  if (!data || typeof data !== 'object') return data;
  
  const encrypted = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] !== null && encrypted[field] !== undefined && encrypted[field] !== '') {
      encrypted[field] = encryptData(encrypted[field]);
    }
  }
  
  return encrypted;
};

/**
 * Decrypt specific fields in an object
 * @param {Object} data - Object with encrypted data
 * @param {Array<string>} fieldsToDecrypt - Field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
export const decryptObjectFields = (data, fieldsToDecrypt) => {
  if (!data || typeof data !== 'object') return data;
  
  const decrypted = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] !== null && decrypted[field] !== undefined) {
      decrypted[field] = decryptData(decrypted[field]);
    }
  }
  
  return decrypted;
};

/**
 * Decrypt array of objects
 * @param {Array<Object>} dataArray - Array of objects
 * @param {Array<string>} fieldsToDecrypt - Field names to decrypt
 * @returns {Array<Object>} - Array with decrypted fields
 */
export const decryptArrayFields = (dataArray, fieldsToDecrypt) => {
  if (!Array.isArray(dataArray)) return dataArray;
  return dataArray.map(item => decryptObjectFields(item, fieldsToDecrypt));
};

// ===============================================
// SENSITIVE FIELDS CONFIGURATION
// ===============================================

/**
 * List of sensitive fields that should be encrypted for each entity type
 * These fields contain PII (Personally Identifiable Information)
 */
export const SENSITIVE_FIELDS = {
  // Applicant fields (from landing page registration)
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
    'applicant_email',
    'email',
    'email_address'
  ],
  
  // Stallholder fields (after becoming stallholder)
  stallholder: [
    'stallholder_name',
    'first_name',
    'middle_name',
    'last_name',
    'contact_number',
    'email',
    'address'
  ],
  
  // Business Employee fields
  employee: [
    'first_name',
    'last_name',
    'middle_name',
    'email',
    'contact_no',
    'phone_number',
    'address'
  ],
  
  // Business Manager fields
  manager: [
    'first_name',
    'last_name',
    'middle_name',
    'email',
    'contact_number',
    'address'
  ],
  
  // Inspector fields
  inspector: [
    'first_name',
    'last_name',
    'email',
    'contact_no'
  ],
  
  // Collector fields
  collector: [
    'first_name',
    'last_name',
    'email',
    'contact_no'
  ],
  
  // Spouse fields
  spouse: [
    'spouse_full_name',
    'spouse_contact_number',
    'spouse_occupation'
  ],
  
  // Business Owner fields
  businessOwner: [
    'first_name',
    'last_name',
    'email',
    'contact_number',
    'owner_full_name',
    'owner_email'
  ]
};

// ===============================================
// HELPER FUNCTIONS FOR SPECIFIC ENTITIES
// ===============================================

/**
 * Encrypt applicant data before saving to database
 */
export const encryptApplicant = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.applicant);
};

/**
 * Decrypt applicant data for display
 */
export const decryptApplicant = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.applicant);
};

/**
 * Decrypt array of applicants
 */
export const decryptApplicants = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.applicant);
};

/**
 * Encrypt stallholder data before saving
 */
export const encryptStallholder = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.stallholder);
};

/**
 * Decrypt stallholder data for display
 */
export const decryptStallholder = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.stallholder);
};

/**
 * Decrypt array of stallholders
 */
export const decryptStallholders = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.stallholder);
};

/**
 * Encrypt employee data before saving
 */
export const encryptEmployee = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.employee);
};

/**
 * Decrypt employee data for display
 */
export const decryptEmployee = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.employee);
};

/**
 * Decrypt array of employees
 */
export const decryptEmployees = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.employee);
};

/**
 * Encrypt manager data before saving
 */
export const encryptManager = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.manager);
};

/**
 * Decrypt manager data for display
 */
export const decryptManager = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.manager);
};

/**
 * Decrypt array of managers
 */
export const decryptManagers = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.manager);
};

/**
 * Encrypt inspector data before saving
 */
export const encryptInspector = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.inspector);
};

/**
 * Decrypt inspector data for display
 */
export const decryptInspector = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.inspector);
};

/**
 * Decrypt array of inspectors
 */
export const decryptInspectors = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.inspector);
};

/**
 * Encrypt collector data before saving
 */
export const encryptCollector = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.collector);
};

/**
 * Decrypt collector data for display
 */
export const decryptCollector = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.collector);
};

/**
 * Decrypt array of collectors
 */
export const decryptCollectors = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.collector);
};

/**
 * Encrypt spouse data before saving
 */
export const encryptSpouse = (data) => {
  return encryptObjectFields(data, SENSITIVE_FIELDS.spouse);
};

/**
 * Decrypt spouse data for display
 */
export const decryptSpouse = (data) => {
  return decryptObjectFields(data, SENSITIVE_FIELDS.spouse);
};

/**
 * Decrypt array of spouses
 */
export const decryptSpouses = (dataArray) => {
  return decryptArrayFields(dataArray, SENSITIVE_FIELDS.spouse);
};

// ===============================================
// EXPORT DEFAULT
// ===============================================

export default {
  // Core functions
  encryptData,
  decryptData,
  isEncrypted,
  
  // Password functions
  hashPassword,
  verifyPassword,
  
  // Object helpers
  encryptObjectFields,
  decryptObjectFields,
  decryptArrayFields,
  
  // Entity-specific helpers
  encryptApplicant,
  decryptApplicant,
  decryptApplicants,
  encryptStallholder,
  decryptStallholder,
  decryptStallholders,
  encryptEmployee,
  decryptEmployee,
  decryptEmployees,
  encryptManager,
  decryptManager,
  decryptManagers,
  encryptInspector,
  decryptInspector,
  decryptInspectors,
  encryptCollector,
  decryptCollector,
  decryptCollectors,
  encryptSpouse,
  decryptSpouse,
  decryptSpouses,
  
  // Configuration
  SENSITIVE_FIELDS
};


