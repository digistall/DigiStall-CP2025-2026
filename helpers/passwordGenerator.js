// ========================================
// PASSWORD GENERATOR UTILITY
// ========================================
// Generates secure random passwords for new user accounts
// Passwords include: uppercase, lowercase, numbers, symbols
// ========================================

import crypto from 'crypto';

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 12)
 * @returns {string} - Generated password
 */
export function generateSecurePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@#$%&*!';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one of each type for complexity requirements
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }
  
  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

/**
 * Generate a temporary password (shorter, for resets)
 * @returns {string} - 8 character temporary password
 */
export function generateTempPassword() {
  return generateSecurePassword(8);
}

/**
 * Generate a strong password (longer, for admins)
 * @returns {string} - 16 character strong password
 */
export function generateStrongPassword() {
  return generateSecurePassword(16);
}

export default {
  generateSecurePassword,
  generateTempPassword,
  generateStrongPassword
};
