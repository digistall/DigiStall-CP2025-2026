/**
 * Data Display Utilities
 * Handles display of potentially encrypted/corrupted data in the UI
 * Provides fallback values when data appears to be in encrypted format
 */

/**
 * Check if a string looks like encrypted data
 * Encrypted format: iv:authTag:encryptedData (all base64)
 * @param {string} value - The value to check
 * @returns {boolean} - True if value appears to be encrypted
 */
export const looksEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  
  // Check for our encryption format: three base64 parts separated by colons
  const parts = value.split(':');
  if (parts.length === 3) {
    // Check if parts look like base64
    const base64Pattern = /^[A-Za-z0-9+/=]+$/;
    return parts.every(part => base64Pattern.test(part) && part.length >= 4);
  }
  
  // Also check for binary/non-printable characters
  const nonPrintable = /[\x00-\x08\x0E-\x1F]/;
  if (nonPrintable.test(value)) return true;
  
  // Check for very long strings that look like encrypted data
  if (value.length > 50 && /^[A-Za-z0-9+/=:]+$/.test(value)) return true;
  
  return false;
};

/**
 * Get a safe display value - returns fallback if value appears encrypted
 * @param {string} value - The value to display
 * @param {string} fallback - Fallback value if encrypted (default: 'User')
 * @returns {string} - Safe value for display
 */
export const getSafeDisplayValue = (value, fallback = 'User') => {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return fallback;
  }
  
  if (looksEncrypted(value)) {
    console.warn('⚠️ Encrypted data detected in display, using fallback:', fallback);
    return fallback;
  }
  
  return value;
};

/**
 * Get safe user name - checks multiple fields and returns first valid one
 * @param {Object} userData - User data object
 * @param {string} fallback - Fallback if no valid name found
 * @returns {string} - Safe display name
 */
export const getSafeUserName = (userData, fallback = 'User') => {
  if (!userData) return fallback;
  
  // Check various name fields in order of preference
  const nameFields = [
    userData.fullName,
    userData.full_name,
    userData.applicant_full_name,
    userData.stallholder_name,
    userData.first_name && userData.last_name 
      ? `${userData.first_name} ${userData.last_name}`.trim()
      : null,
    userData.firstName && userData.lastName 
      ? `${userData.firstName} ${userData.lastName}`.trim()
      : null,
    userData.name,
  ];
  
  for (const name of nameFields) {
    if (name && typeof name === 'string' && name.trim() !== '' && !looksEncrypted(name)) {
      return name.trim();
    }
  }
  
  // Only use username as absolute last resort if nothing else works
  if (userData.username && !looksEncrypted(userData.username)) {
    return userData.username;
  }
  
  return fallback;
};

/**
 * Get safe contact info - email or phone number
 * @param {Object} userData - User data object  
 * @param {string} fallback - Fallback if no valid contact found
 * @returns {string} - Safe contact info
 */
export const getSafeContactInfo = (userData, fallback = '') => {
  if (!userData) return fallback;
  
  // Check various contact fields
  const contactFields = [
    userData.email,
    userData.applicant_email,
    userData.contactNumber,
    userData.contact_number,
    userData.phoneNumber,
    userData.phone_number,
    userData.applicant_contact_number,
    userData.username,
  ];
  
  for (const contact of contactFields) {
    if (contact && !looksEncrypted(contact)) {
      return contact;
    }
  }
  
  return fallback;
};

/**
 * Get safe staff name for inspector/collector
 * @param {Object} staffData - Staff data object (may have nested structure)
 * @param {string} fallback - Fallback if no valid name found
 * @returns {string} - Safe display name
 */
export const getSafeStaffName = (staffData, fallback = 'Staff') => {
  if (!staffData) return fallback;
  
  // Handle nested staff object structure
  const staff = staffData.staff || staffData;
  
  // Try full name fields first
  const fullNameFields = [
    staff.fullName,
    staff.full_name,
    staff.inspector_name,
    staff.collector_name,
  ];
  
  for (const name of fullNameFields) {
    if (name && typeof name === 'string' && name.trim() !== '' && !looksEncrypted(name)) {
      return name.trim();
    }
  }
  
  // Try first + last name combination
  const firstName = staff.firstName || staff.first_name;
  const lastName = staff.lastName || staff.last_name;
  
  if (firstName && lastName && !looksEncrypted(firstName) && !looksEncrypted(lastName)) {
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName && fullName !== ' ') {
      return fullName;
    }
  }
  
  if (firstName && !looksEncrypted(firstName) && firstName.trim() !== '') {
    return firstName.trim();
  }
  
  // Only use username as absolute last resort
  if (staff.username && !looksEncrypted(staff.username)) {
    return staff.username;
  }
  
  return fallback;
};

/**
 * Get safe staff contact info
 * @param {Object} staffData - Staff data object (may have nested structure)
 * @param {string} fallback - Fallback if no valid contact found
 * @returns {string} - Safe contact info
 */
export const getSafeStaffContact = (staffData, fallback = '') => {
  if (!staffData) return fallback;
  
  const staff = staffData.staff || staffData;
  
  const contactFields = [
    staff.email,
    staff.contactNumber,
    staff.contact_number,
    staff.phoneNumber,
    staff.phone_number,
    staff.contact_no,
    staff.username,
  ];
  
  for (const contact of contactFields) {
    if (contact && !looksEncrypted(contact)) {
      return contact;
    }
  }
  
  return fallback;
};

/**
 * Get user initials from name
 * @param {string} fullName - Full name string
 * @param {string} fallback - Fallback initials
 * @returns {string} - Initials (1-2 characters)
 */
export const getUserInitials = (fullName, fallback = 'U') => {
  if (!fullName || looksEncrypted(fullName)) return fallback;
  
  const names = fullName.trim().split(' ').filter(n => n.length > 0);
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  if (names.length === 1) {
    return names[0][0].toUpperCase();
  }
  
  return fallback;
};

export default {
  looksEncrypted,
  getSafeDisplayValue,
  getSafeUserName,
  getSafeContactInfo,
  getSafeStaffName,
  getSafeStaffContact,
  getUserInitials,
};
