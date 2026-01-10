/**
 * Data Encryption Utility (Mobile Backend)
 * Provides encryption and decryption for sensitive user data
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️ DATA_ENCRYPTION_KEY not set in environment. Using generated key.');
    return crypto.scryptSync('digistall-secure-key-change-in-production', 'salt', 32);
  }
  return crypto.scryptSync(key, 'digistall-salt', 32);
};

export const encryptData = (plainText) => {
  if (!plainText || plainText === '') return plainText;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData) => {
  if (!encryptedData || encryptedData === '' || !encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;

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
    return encryptedData;
  }
};

export const isEncrypted = (data) => {
  if (!data || typeof data !== 'string') return false;
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  try {
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    return true;
  } catch { return false; }
};

export const hashData = (plainText) => {
  if (!plainText || plainText === '') return plainText;
  return crypto.createHash('sha256').update(plainText).digest('hex');
};

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

export const SENSITIVE_FIELDS = {
  applicant: ['applicant_full_name', 'first_name', 'middle_name', 'last_name', 'address', 'contact_number', 'email', 'birthdate'],
  stallholder: ['stallholder_name', 'contact_number', 'email', 'address', 'business_name'],
  employee: ['first_name', 'last_name', 'email', 'contact_no', 'address'],
  inspector: ['first_name', 'last_name', 'email', 'contact_no'],
  collector: ['first_name', 'last_name', 'email', 'contact_no']
};

export default { encryptData, decryptData, isEncrypted, hashData, encryptObjectFields, decryptObjectFields, SENSITIVE_FIELDS };
