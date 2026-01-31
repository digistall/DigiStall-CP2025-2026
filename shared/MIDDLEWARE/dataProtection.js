/**
 * Data Protection Middleware
 * Automatically handles encryption/decryption of sensitive user data
 * 
 * This middleware:
 * 1. Decrypts incoming encrypted data from database
 * 2. Encrypts sensitive data before storing to database
 */

import { decryptData, isEncrypted, SENSITIVE_FIELDS } from '../SERVICES/encryptionService.js';

/**
 * Middleware to decrypt sensitive fields in response data
 * Automatically detects encrypted fields and decrypts them
 */
export const decryptResponseMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    try {
      const decryptedData = decryptResponseData(data);
      return originalJson(decryptedData);
    } catch (error) {
      console.error('Error in decrypt middleware:', error.message);
      return originalJson(data);
    }
  };
  
  next();
};

/**
 * Recursively decrypt response data
 */
const decryptResponseData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => decryptResponseData(item));
  }

  if (typeof data === 'object') {
    const decrypted = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && isEncrypted(value)) {
        decrypted[key] = decryptData(value);
      } else if (typeof value === 'object') {
        decrypted[key] = decryptResponseData(value);
      } else {
        decrypted[key] = value;
      }
    }
    
    return decrypted;
  }

  return data;
};

/**
 * Helper to decrypt a single object with known sensitive fields
 */
export const decryptUserData = (userData, entityType = 'applicant') => {
  if (!userData || typeof userData !== 'object') {
    return userData;
  }

  const fieldsToDecrypt = SENSITIVE_FIELDS[entityType] || [];
  const decrypted = { ...userData };

  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string' && isEncrypted(decrypted[field])) {
      decrypted[field] = decryptData(decrypted[field]);
    }
  }

  return decrypted;
};

/**
 * Decrypt array of user data
 */
export const decryptUsersData = (usersData, entityType = 'applicant') => {
  if (!Array.isArray(usersData)) {
    return usersData;
  }

  return usersData.map(user => decryptUserData(user, entityType));
};

export default {
  decryptResponseMiddleware,
  decryptUserData,
  decryptUsersData
};
