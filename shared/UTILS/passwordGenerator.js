// ===== PASSWORD GENERATOR UTILITY =====
// Generates secure random passwords

import crypto from 'crypto';

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 16)
 * @param {Object} options - Options for password generation
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSpecial - Include special characters (default: true)
 * @returns {string} Generated password
 */
export function generateSecurePassword(length = 16, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecial = true
  } = options;

  let chars = '';
  let password = '';
  
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (includeUppercase) chars += uppercase;
  if (includeLowercase) chars += lowercase;
  if (includeNumbers) chars += numbers;
  if (includeSpecial) chars += special;
  
  if (!chars) {
    chars = lowercase + numbers; // Default fallback
  }
  
  // Ensure at least one character from each required set
  if (includeUppercase) password += uppercase[crypto.randomInt(uppercase.length)];
  if (includeLowercase) password += lowercase[crypto.randomInt(lowercase.length)];
  if (includeNumbers) password += numbers[crypto.randomInt(numbers.length)];
  if (includeSpecial) password += special[crypto.randomInt(special.length)];
  
  // Fill remaining length
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += chars[crypto.randomInt(chars.length)];
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}

/**
 * Generate a simple numeric PIN
 * @param {number} length - PIN length (default: 6)
 * @returns {string} Generated PIN
 */
export function generatePIN(length = 6) {
  const numbers = '0123456789';
  let pin = '';
  
  for (let i = 0; i < length; i++) {
    pin += numbers[crypto.randomInt(numbers.length)];
  }
  
  return pin;
}

/**
 * Generate a temporary password (easier to read)
 * @param {number} length - Password length (default: 12)
 * @returns {string} Generated temporary password
 */
export function generateTempPassword(length = 12) {
  // Avoid confusing characters like 0/O, 1/l/I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars[crypto.randomInt(chars.length)];
  }
  
  return password;
}

export default {
  generateSecurePassword,
  generatePIN,
  generateTempPassword
};
