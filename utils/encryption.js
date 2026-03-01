// ===== ENCRYPTION UTILITY =====
// Shared encryption/decryption functions

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data
 */
export function encryptData(text) {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

/**
 * Decrypt data
 */
export function decryptData(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Check if data is encrypted (contains colon separator)
  if (!text.includes(':')) return text;
  
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, return original text
    console.error('Decryption error (may not be encrypted):', error.message);
    return text;
  }
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate random token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export const EncryptionUtils = {
  encryptData,
  decryptData,
  hashData,
  generateToken
};

export default EncryptionUtils;
