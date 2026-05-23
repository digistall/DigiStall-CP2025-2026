// ===== PASSWORD RESET CONTROLLER =====
// Handles forgot password flow with email verification using Nodemailer

import { createConnection } from '../../../config/database.js'
import { decryptData, encryptData } from '../../../services/encryptionService.js'
import { decryptAES256GCM } from '../../../services/mysqlDecryptionService.js'
import emailService from '../../../services/emailService.js'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

// In-memory store for password reset codes (in production, use Redis or database)
const resetCodes = new Map();

// Helper function to decrypt data safely
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

// User type configurations for password reset
const userTypes = [
  {
    type: 'system_administrator',
    procedure: 'getSystemAdminByEmail',
    idField: 'system_admin_id',
    passwordField: 'admin_password',
    updateTable: 'system_administrator',
    updateIdField: 'system_admin_id',
    nameFields: ['first_name', 'last_name']
  },
  {
    type: 'stall_business_owner',
    procedure: 'getBusinessOwnerByEmail',
    idField: 'business_owner_id',
    passwordField: 'owner_password',
    updateTable: 'stall_business_owner',
    updateIdField: 'business_owner_id',
    nameFields: ['first_name', 'last_name']
  },
  {
    type: 'business_manager',
    procedure: 'getBusinessManagerByEmail',
    idField: 'business_manager_id',
    passwordField: 'manager_password',
    updateTable: 'business_manager',
    updateIdField: 'business_manager_id',
    nameFields: ['first_name', 'last_name']
  },
  {
    type: 'business_employee',
    procedure: 'getBusinessEmployeeByEmail',
    idField: 'business_employee_id',
    passwordField: 'employee_password',
    updateTable: 'business_employee',
    updateIdField: 'business_employee_id',
    nameFields: ['first_name', 'last_name']
  },
  {
    type: 'inspector',
    procedure: 'getInspectorByEmail',
    idField: 'inspector_id',
    passwordField: 'password',
    updateTable: 'inspector',
    updateIdField: 'inspector_id',
    nameFields: ['first_name', 'last_name']
  },
  {
    type: 'collector',
    procedure: 'getCollectorByEmail',
    idField: 'collector_id',
    passwordField: 'password',
    updateTable: 'collector',
    updateIdField: 'collector_id',
    nameFields: ['first_name', 'last_name']
  },
  {
    // Mobile stallholders/applicants — email in applicant.applicant_email,
    // password (bcrypt) in credential.password_hash, linked by credential_id
    // NOTE: applicant_email is AES-256-GCM encrypted (non-deterministic), so
    //       the stored procedure cannot find by plain email. We use a direct
    //       query + Node.js-level decryption instead (see findApplicantByEmail).
    type: 'applicant',
    procedure: null,                       // not used — see findApplicantByEmail()
    idField: 'applicant_id',
    passwordField: 'password_hash',        // in credential table, not applicant
    updateTable: 'credential',             // UPDATE credential SET password_hash
    updateIdField: 'credential_id',        // WHERE credential_id = ?
    nameFields: ['applicant_full_name'],   // single combined name field
    useBcrypt: true                        // flag: hash with bcrypt, not AES encrypt
  }
];

/**
 * Find an applicant/stallholder by plain-text email.
 *
 * Because applicant_email is stored as AES-256-GCM (non-deterministic),
 * we cannot search via the stored procedure. Instead we fetch all
 * applicants that have a credential record, decrypt each email at the
 * Node.js level, and return the first match.
 *
 * @param {object} connection - Active MySQL connection
 * @param {string} plainEmail  - The plain-text email to look for (lowercase)
 * @returns {object|null}       - The matching applicant row, or null if not found
 */
const findApplicantByEmail = async (connection, plainEmail) => {
  // email_address lives in other_information (encrypted), linked to applicant via applicant_id.
  // applicant_full_name lives in the applicant table (encrypted).
  // We only consider applicants that already have a credential record (active mobile users).
  const [rows] = await connection.execute(
    `SELECT a.applicant_id, a.applicant_full_name, oi.email_address
     FROM applicant a
     INNER JOIN credential c  ON c.applicant_id  = a.applicant_id
     INNER JOIN other_information oi ON oi.applicant_id = a.applicant_id
     WHERE oi.email_address IS NOT NULL`
  );

  const normalised = plainEmail.trim().toLowerCase();

  for (const row of rows) {
    const decrypted = decryptAES256GCM(row.email_address);
    if (decrypted && decrypted.trim().toLowerCase() === normalised) {
      // Normalise the returned object so the rest of the controller
      // can read applicant_id and applicant_full_name as expected.
      return {
        applicant_id: row.applicant_id,
        applicant_full_name: row.applicant_full_name
      };
    }
  }
  return null;
};

/**
 * Verify if an email exists in the system (no email sending - frontend uses EmailJS)
 * POST /api/auth/verify-email-exists
 */
export const verifyEmailExists = async (req, res) => {
  let connection;
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log('🔍 Verifying email exists:', email);
    
    connection = await createConnection();
    
    // Try each user type to find the email
    for (const config of userTypes) {
      try {
        console.log(`🔍 Checking ${config.type}...`);

        let users = [];

        if (config.type === 'applicant') {
          // applicant_email is AES-256-GCM encrypted — use Node.js-level decryption
          const matchedApplicant = await findApplicantByEmail(connection, email);
          if (matchedApplicant) users = [matchedApplicant];
        } else {
          const [userRows] = await connection.execute(`CALL ${config.procedure}(?)`, [email]);
          users = userRows[0] || [];
        }

        if (users.length > 0) {
          const user = users[0];
          
          // Get user's name for the email
          let userName = 'User';
          if (config.nameFields.length === 1) {
            // Single combined name field (e.g. applicant_full_name)
            userName = decryptSafe(user[config.nameFields[0]]) || 'User';
          } else if (config.nameFields.length >= 2) {
            const firstName = decryptSafe(user[config.nameFields[0]]) || '';
            const lastName = decryptSafe(user[config.nameFields[1]]) || '';
            userName = `${firstName} ${lastName}`.trim() || 'User';
          }
          
          console.log(`✅ Found user as ${config.type}: ${userName}`);
          
          // Return success - frontend will send email via EmailJS
          return res.status(200).json({
            success: true,
            message: 'Email verified',
            userType: config.type,
            userName: userName,
            userId: user[config.idField]
          });
        }
      } catch (error) {
        console.log(`❌ Error checking ${config.type}:`, error.message);
        // Continue to next user type
      }
    }
    
    console.log('❌ Email not found in any user table');
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address. Please check your email and try again.'
    });
    
  } catch (error) {
    console.error('❌ Error verifying email:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying your email. Please try again.'
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
};

/**
 * Store reset code sent by frontend (EmailJS)
 * POST /api/auth/store-reset-code
 */
export const storeResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }
    
    console.log('📝 Storing reset code for:', email);
    
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    // Store the code
    resetCodes.set(email.toLowerCase(), {
      code: code,
      expiresAt: expiresAt,
      verified: false,
      attempts: 0
    });
    
    console.log('✅ Reset code stored successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Reset code stored successfully'
    });
    
  } catch (error) {
    console.error('❌ Error storing reset code:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while storing the reset code.'
    });
  }
};

/**
 * Generate a 6-digit verification code
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Resend verification code
 * POST /api/auth/resend-reset-code
 */
export const resendResetCode = async (req, res) => {
  let connection;
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log('🔄 Resending reset code for:', email);
    
    connection = await createConnection();
    
    // Find the user again to get their name
    let userName = 'User';
    
    for (const config of userTypes) {
      try {
        let users = [];

        if (config.type === 'applicant') {
          // applicant_email is AES-256-GCM encrypted — use Node.js-level decryption
          const matchedApplicant = await findApplicantByEmail(connection, email);
          if (matchedApplicant) users = [matchedApplicant];
        } else {
          const [userRows] = await connection.execute(`CALL ${config.procedure}(?)`, [email]);
          users = userRows[0] || [];
        }

        if (users.length > 0) {
          const user = users[0];
          if (config.nameFields.length === 1) {
            userName = decryptSafe(user[config.nameFields[0]]) || 'User';
          } else if (config.nameFields.length >= 2) {
            const firstName = decryptSafe(user[config.nameFields[0]]) || '';
            const lastName = decryptSafe(user[config.nameFields[1]]) || '';
            userName = `${firstName} ${lastName}`.trim() || 'User';
          }
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000);
    
    // Get existing data or create new
    const existingData = resetCodes.get(email.toLowerCase()) || {};
    
    // Update the code
    resetCodes.set(email.toLowerCase(), {
      ...existingData,
      code: verificationCode,
      expiresAt: expiresAt,
      verified: false,
      attempts: 0
    });
    
    // Send verification code via email
    try {
      await emailService.sendPasswordResetCodeEmail({
        email: email,
        userName: userName,
        verificationCode: verificationCode,
        expiryMinutes: 10
      });
      
      console.log('✅ New verification code sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'New verification code sent to your email'
    });
    
  } catch (error) {
    console.error('❌ Error resending code:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
};

/**
 * Verify the reset code entered by user
 * POST /api/auth/verify-reset-code
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }
    
    console.log('🔐 Verifying reset code for:', email);
    
    const storedData = resetCodes.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No reset code found. Please request a new code.'
      });
    }
    
    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      resetCodes.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }
    
    // Check maximum attempts (prevent brute force)
    if (storedData.attempts >= 5) {
      resetCodes.delete(email.toLowerCase());
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }
    
    // Verify the code
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${5 - storedData.attempts} attempts remaining.`
      });
    }
    
    // Mark as verified
    storedData.verified = true;
    
    console.log('✅ Code verified successfully for:', email);
    
    return res.status(200).json({
      success: true,
      message: 'Code verified successfully'
    });
    
  } catch (error) {
    console.error('❌ Error verifying reset code:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
};

/**
 * Reset user's password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  let connection;
  
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required'
      });
    }
    
    console.log('🔐 Resetting password for:', email);
    
    // Verify the code is valid and verified
    const storedData = resetCodes.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No reset code found. Please start the process again.'
      });
    }
    
    if (!storedData.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your code first.'
      });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.'
      });
    }
    
    if (Date.now() > storedData.expiresAt) {
      resetCodes.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'Session expired. Please start the process again.'
      });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter.'
      });
    }
    
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter.'
      });
    }
    
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number.'
      });
    }
    
    connection = await createConnection();
    
    // Find the user and their type
    let foundUser = null;
    let foundConfig = null;
    
    for (const config of userTypes) {
      try {
        let users = [];

        if (config.type === 'applicant') {
          // applicant_email is AES-256-GCM encrypted — use Node.js-level decryption
          const matchedApplicant = await findApplicantByEmail(connection, email);
          if (matchedApplicant) users = [matchedApplicant];
        } else {
          const [userRows] = await connection.execute(`CALL ${config.procedure}(?)`, [email]);
          users = userRows[0] || [];
        }

        if (users.length > 0) {
          foundUser = users[0];
          foundConfig = config;
          console.log(`✅ Found user as ${config.type}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Error checking ${config.type}:`, error.message);
      }
    }
    
    if (!foundUser || !foundConfig) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please try again.'
      });
    }
    
    // Encrypt/hash the new password based on user type
    let finalPassword;
    let updateQuery;
    let updateId;

    if (foundConfig.useBcrypt) {
      // Mobile applicants/stallholders use bcrypt in the credential table
      // Must look up credential_id from credential table via applicant_id
      const [credRows] = await connection.execute(
        'SELECT credential_id FROM credential WHERE applicant_id = ? LIMIT 1',
        [foundUser[foundConfig.idField]]
      );
      if (!credRows || credRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Credential record not found for this account. Please contact support.'
        });
      }
      finalPassword = await bcrypt.hash(newPassword, 10);
      updateQuery = `UPDATE credential SET password_hash = ? WHERE credential_id = ?`;
      updateId = credRows[0].credential_id;
      console.log('🔐 Password bcrypt-hashed, updating credential table...');
    } else {
      // Web users use AES-256-GCM encryption in their own table
      finalPassword = encryptData(newPassword);
      updateQuery = `UPDATE ${foundConfig.updateTable} SET ${foundConfig.passwordField} = ? WHERE ${foundConfig.updateIdField} = ?`;
      updateId = foundUser[foundConfig.idField];
      console.log('🔐 Password AES-encrypted, updating database...');
    }

    await connection.execute(updateQuery, [finalPassword, updateId]);
    
    console.log('✅ Password updated successfully for:', email);
    
    // Clear the reset code
    resetCodes.delete(email.toLowerCase());
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again.'
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
};

/**
 * Cleanup expired reset codes from memory
 */
const cleanupExpiredCodes = () => {
  const now = Date.now();
  for (const [email, data] of resetCodes.entries()) {
    if (now > data.expiresAt) {
      resetCodes.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

export default {
  verifyEmailExists,
  storeResetCode,
  resendResetCode,
  verifyResetCode,
  resetPassword
};
