/**
 * MySQL AES Decryption Service (Mobile Backend)
 * 
 * This service handles decryption of data that was encrypted using MySQL's AES_ENCRYPT function.
 * MySQL uses AES-128-ECB mode by default, which differs from Node.js crypto's typical modes.
 * 
 * The encryption key is stored in the database's `encryption_keys` table.
 */

import crypto from 'crypto';
import { createConnection } from '../config/database.js';

// Cache the encryption key to avoid repeated database queries
let cachedKey = null;
let keyFetchedAt = null;
const KEY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
 * Decrypt data that was encrypted using MySQL's AES_ENCRYPT
 * MySQL uses AES-128-ECB by default
 * 
 * @param {Buffer|string} encryptedData - The encrypted data (Buffer from MySQL BLOB or hex string)
 * @param {string} key - The encryption key
 * @returns {string|null} The decrypted plaintext or null if failed
 */
export const decryptMySQLAES = (encryptedData, key) => {
  if (!encryptedData || !key) {
    return null;
  }

  try {
    // Convert to Buffer if it's not already
    let encryptedBuffer;
    if (Buffer.isBuffer(encryptedData)) {
      encryptedBuffer = encryptedData;
    } else if (typeof encryptedData === 'string') {
      // Try to detect if it's hex or raw string
      if (/^[0-9a-fA-F]+$/.test(encryptedData)) {
        encryptedBuffer = Buffer.from(encryptedData, 'hex');
      } else {
        encryptedBuffer = Buffer.from(encryptedData, 'binary');
      }
    } else {
      return null;
    }

    // MySQL AES_ENCRYPT uses AES-128-ECB with key padding
    // Key is padded/truncated to 16 bytes for AES-128
    const keyBuffer = Buffer.alloc(16, 0); // Initialize with zeros
    const keyBytes = Buffer.from(key, 'utf8');
    
    // MySQL key folding: XOR key bytes in 16-byte chunks
    for (let i = 0; i < keyBytes.length; i++) {
      keyBuffer[i % 16] ^= keyBytes[i];
    }

    const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuffer, null);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Clean up result - remove any null padding
    const result = decrypted.toString('utf8').replace(/\0+$/, '');
    console.log('🔓 Decrypted value:', result.substring(0, 20) + '...');
    return result;
  } catch (error) {
    console.error('MySQL AES decryption error:', error.message);
    return null;
  }
};

/**
 * Check if a value looks like it might be encrypted (binary blob)
 * @param {any} value - The value to check
 * @returns {boolean}
 */
export const looksEncrypted = (value) => {
  if (!value) return false;
  
  // Buffer (BLOB) from MySQL
  if (Buffer.isBuffer(value)) return true;
  
  // String that contains non-printable characters
  if (typeof value === 'string') {
    // Check for binary data or base64-like patterns
    const nonPrintable = /[\x00-\x08\x0E-\x1F\x80-\xFF]/;
    return nonPrintable.test(value);
  }
  
  return false;
};

/**
 * Decrypt a single field if it appears to be encrypted
 * @param {any} value - The field value
 * @param {string} key - The encryption key
 * @returns {string} - Decrypted value or original if not encrypted
 */
export const decryptFieldIfNeeded = (value, key) => {
  if (!value || !key) return value;
  
  // If it's a Buffer (BLOB from MySQL), try to decrypt
  if (Buffer.isBuffer(value)) {
    const decrypted = decryptMySQLAES(value, key);
    return decrypted || value.toString('utf8');
  }
  
  // If it's a string with binary characters, try to decrypt
  if (typeof value === 'string' && looksEncrypted(value)) {
    const decrypted = decryptMySQLAES(value, key);
    return decrypted || value;
  }
  
  return value;
};

/**
 * Decrypt sensitive fields in a user/staff object
 * @param {Object} data - The data object from database
 * @param {string} key - The encryption key
 * @param {boolean} isEncryptedFlag - Whether the record is marked as encrypted (is_encrypted field)
 * @returns {Object} - Object with decrypted fields
 */
export const decryptUserData = (data, key, isEncryptedFlag = false) => {
  if (!data || !key) return data;
  
  // Check if data is encrypted
  const isEncrypted = isEncryptedFlag || data.is_encrypted === 1 || data.is_encrypted === '1' || data.is_encrypted === true;
  
  console.log('🔐 decryptUserData called:', {
    hasData: !!data,
    hasKey: !!key,
    isEncrypted: isEncrypted,
    is_encrypted_field: data.is_encrypted,
    has_encrypted_full_name: !!data.encrypted_full_name,
    has_encrypted_first_name: !!data.encrypted_first_name
  });
  
  if (!isEncrypted) {
    console.log('⏭️ Data not marked as encrypted, returning as-is');
    return data;
  }
  
  const result = { ...data };
  
  // Fields that may be encrypted
  const sensitiveFields = [
    // Inspector/Collector fields
    { encrypted: 'encrypted_first_name', plain: 'first_name' },
    { encrypted: 'encrypted_last_name', plain: 'last_name' },
    { encrypted: 'encrypted_contact', plain: 'contact_no' },
    { encrypted: 'encrypted_contact', plain: 'contact_number' },
    { encrypted: 'encrypted_phone', plain: 'contact_no' },
    { encrypted: 'encrypted_phone', plain: 'phone_number' },
    // Applicant fields
    { encrypted: 'encrypted_full_name', plain: 'applicant_full_name' },
    { encrypted: 'encrypted_full_name', plain: 'full_name' },
    { encrypted: 'encrypted_contact', plain: 'applicant_contact_number' },
    { encrypted: 'encrypted_address', plain: 'applicant_address' },
    { encrypted: 'encrypted_address', plain: 'address' },
    { encrypted: 'encrypted_birthdate', plain: 'applicant_birthdate' },
    // Stallholder fields
    { encrypted: 'encrypted_name', plain: 'stallholder_name' },
    { encrypted: 'encrypted_contact', plain: 'stallholder_contact' },
    { encrypted: 'encrypted_email', plain: 'email' },
    { encrypted: 'encrypted_email', plain: 'stallholder_email' },
    // Spouse fields
    { encrypted: 'encrypted_full_name', plain: 'spouse_full_name' },
    { encrypted: 'encrypted_contact', plain: 'spouse_contact_number' },
    { encrypted: 'spouse_encrypted_full_name', plain: 'spouse_full_name' },
    { encrypted: 'spouse_encrypted_contact', plain: 'spouse_contact_number' },
  ];
  
  for (const field of sensitiveFields) {
    // If encrypted field exists and has data
    if (result[field.encrypted] && (Buffer.isBuffer(result[field.encrypted]) || result[field.encrypted])) {
      console.log(`🔓 Decrypting field ${field.encrypted} -> ${field.plain}`);
      const decrypted = decryptFieldIfNeeded(result[field.encrypted], key);
      if (decrypted && decrypted !== result[field.encrypted]) {
        result[field.plain] = decrypted;
        console.log(`✅ Decrypted ${field.plain}:`, decrypted.substring(0, 20) + '...');
      }
    }
  }
  
  return result;
};

/**
 * Decrypt staff data (inspector/collector) after login
 * @param {Object} staffData - Staff data from database
 * @returns {Promise<Object>} - Staff data with decrypted names
 */
export const decryptStaffData = async (staffData) => {
  if (!staffData) return staffData;
  
  // Get encryption key
  const key = await getEncryptionKeyFromDB();
  if (!key) {
    console.warn('⚠️ No encryption key available, returning data as-is');
    return staffData;
  }
  
  // Check if data is encrypted either by flag or by presence of encrypted field BLOBs
  const isEncrypted = staffData.is_encrypted === 1 || staffData.is_encrypted === true;
  const hasEncryptedFields = Buffer.isBuffer(staffData.encrypted_first_name) ||
                              Buffer.isBuffer(staffData.encrypted_last_name) ||
                              Buffer.isBuffer(staffData.encrypted_contact) ||
                              Buffer.isBuffer(staffData.encrypted_email) ||
                              Buffer.isBuffer(staffData.encrypted_phone);
  
  console.log('🔐 decryptStaffData check:', {
    is_encrypted_flag: staffData.is_encrypted,
    hasEncryptedFields: hasEncryptedFields
  });
  
  if (!isEncrypted && !hasEncryptedFields) {
    console.log('⏭️ No encryption detected in staff data');
    return staffData;
  }
  
  console.log('🔓 Decrypting staff data...');
  return decryptUserData(staffData, key, true);
};

/**
 * Decrypt applicant data after login
 * @param {Object} applicantData - Applicant/credential data from database
 * @returns {Promise<Object>} - Data with decrypted fields
 */
export const decryptApplicantData = async (applicantData) => {
  if (!applicantData) return applicantData;
  
  const key = await getEncryptionKeyFromDB();
  if (!key) {
    console.warn('⚠️ No encryption key available, returning data as-is');
    return applicantData;
  }
  
  // Check if is_encrypted flag is set OR if we have encrypted field BLOBs
  const isEncrypted = applicantData.is_encrypted === 1 || applicantData.is_encrypted === true;
  const hasEncryptedFields = Buffer.isBuffer(applicantData.encrypted_full_name) || 
                              Buffer.isBuffer(applicantData.encrypted_contact) ||
                              Buffer.isBuffer(applicantData.encrypted_address);
  
  console.log('🔐 decryptApplicantData check:', {
    is_encrypted_flag: applicantData.is_encrypted,
    hasEncryptedFields: hasEncryptedFields,
    encrypted_full_name_type: typeof applicantData.encrypted_full_name,
    encrypted_full_name_isBuffer: Buffer.isBuffer(applicantData.encrypted_full_name),
    encrypted_full_name_value: applicantData.encrypted_full_name ? 
      (Buffer.isBuffer(applicantData.encrypted_full_name) ? 
        `Buffer(${applicantData.encrypted_full_name.length} bytes)` : 
        String(applicantData.encrypted_full_name).substring(0, 30)) : 'null/undefined',
    current_applicant_full_name: applicantData.applicant_full_name
  });
  
  if (!isEncrypted && !hasEncryptedFields) {
    console.log('⏭️ No encryption detected, returning data as-is');
    return applicantData;
  }
  
  console.log('🔓 Decrypting applicant data...');
  return decryptUserData(applicantData, key, true);
};

/**
 * Decrypt stallholder data
 * @param {Object} stallholderData - Stallholder data from database
 * @returns {Promise<Object>} - Data with decrypted fields
 */
export const decryptStallholderData = async (stallholderData) => {
  if (!stallholderData) return stallholderData;
  
  const key = await getEncryptionKeyFromDB();
  if (!key) return stallholderData;
  
  const isEncrypted = stallholderData.is_encrypted === 1 || stallholderData.is_encrypted === true;
  const hasEncryptedFields = Buffer.isBuffer(stallholderData.encrypted_name) ||
                              Buffer.isBuffer(stallholderData.encrypted_contact) ||
                              Buffer.isBuffer(stallholderData.encrypted_email);
  
  console.log('🔐 decryptStallholderData check:', {
    is_encrypted_flag: stallholderData.is_encrypted,
    hasEncryptedFields: hasEncryptedFields
  });
  
  if (!isEncrypted && !hasEncryptedFields) {
    console.log('⏭️ No encryption detected in stallholder data');
    return stallholderData;
  }
  
  console.log('🔓 Decrypting stallholder data...');
  return decryptUserData(stallholderData, key, true);
};

/**
 * Decrypt spouse data
 * @param {Object} spouseData - Spouse data from database
 * @returns {Promise<Object>} - Data with decrypted fields
 */
export const decryptSpouseData = async (spouseData) => {
  if (!spouseData) return spouseData;
  
  const key = await getEncryptionKeyFromDB();
  if (!key) return spouseData;
  
  const isEncrypted = spouseData.is_encrypted === 1 || spouseData.is_encrypted === true ||
                      spouseData.spouse_is_encrypted === 1 || spouseData.spouse_is_encrypted === true;
  const hasEncryptedFields = Buffer.isBuffer(spouseData.encrypted_full_name) ||
                              Buffer.isBuffer(spouseData.encrypted_contact) ||
                              Buffer.isBuffer(spouseData.spouse_encrypted_full_name) ||
                              Buffer.isBuffer(spouseData.spouse_encrypted_contact);
  
  console.log('🔐 decryptSpouseData check:', {
    is_encrypted_flag: spouseData.is_encrypted,
    spouse_is_encrypted_flag: spouseData.spouse_is_encrypted,
    hasEncryptedFields: hasEncryptedFields
  });
  
  if (!isEncrypted && !hasEncryptedFields) {
    console.log('⏭️ No encryption detected in spouse data');
    return spouseData;
  }
  
  console.log('🔓 Decrypting spouse data...');
  return decryptUserData(spouseData, key, true);
};

export default {
  getEncryptionKeyFromDB,
  decryptMySQLAES,
  decryptFieldIfNeeded,
  decryptUserData,
  decryptStaffData,
  decryptApplicantData,
  decryptStallholderData,
  decryptSpouseData,
  looksEncrypted
};
