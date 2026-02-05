import { createConnection } from '../config/database.js'
import bcrypt from 'bcryptjs'

/**
 * Change password for mobile stallholder users
 * POST /api/mobile/auth/change-password
 * 
 * Requires authentication (verifyToken middleware)
 * 
 * Request body:
 * - currentPassword: string
 * - newPassword: string
 */
export const mobileChangePassword = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { currentPassword, newPassword } = req.body;
    
    // Get user info from JWT token (set by verifyToken middleware)
    const userId = req.user?.id || req.user?.userId || req.user?.registrationId;
    const userType = req.user?.userType || req.user?.type || 'stallholder';
    
    console.log('🔐 Password change request for user:', userId, 'type:', userType);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one lowercase letter'
      });
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter'
      });
    }
    
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one number'
      });
    }
    
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Handle different user types
    if (userType === 'stallholder' || userType === 'applicant') {
      // For stallholders, get credentials from credential table
      const [credentialResult] = await connection.execute(
        'SELECT registrationid, password_hash FROM credential WHERE registrationid = ?',
        [userId]
      );
      
      if (credentialResult.length === 0) {
        console.log('❌ Credential not found for user:', userId);
        return res.status(404).json({
          success: false,
          message: 'User credentials not found'
        });
      }
      
      const credential = credentialResult[0];
      
      // Verify current password
      let isValidPassword = false;
      
      try {
        if (credential.password_hash?.startsWith('$2b$') || credential.password_hash?.startsWith('$2a$')) {
          // BCrypt hashed password
          isValidPassword = await bcrypt.compare(currentPassword, credential.password_hash);
        } else {
          // Legacy plain text password (temporary support)
          isValidPassword = currentPassword === credential.password_hash;
          console.log('⚠️ User has legacy plain text password, will be upgraded to bcrypt');
        }
      } catch (error) {
        console.error('❌ Password verification error:', error);
        isValidPassword = false;
      }
      
      if (!isValidPassword) {
        console.log('❌ Current password incorrect for user:', userId);
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password in credential table
      await connection.execute(
        'UPDATE credential SET password_hash = ?, updated_at = NOW() WHERE registrationid = ?',
        [hashedPassword, userId]
      );
      
      console.log('✅ Password changed successfully for stallholder:', userId);
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } else if (userType === 'inspector' || userType === 'collector' || userType === 'staff') {
      // For staff (inspector/collector), get password from the appropriate table
      const staffId = req.user?.staffId || req.user?.id;
      const role = req.user?.role || userType;
      
      let tableName = role === 'inspector' ? 'inspector' : 'collector';
      let idColumn = role === 'inspector' ? 'inspector_id' : 'collector_id';
      
      const [staffResult] = await connection.execute(
        `SELECT ${idColumn}, password FROM ${tableName} WHERE ${idColumn} = ?`,
        [staffId]
      );
      
      if (staffResult.length === 0) {
        console.log('❌ Staff not found:', staffId);
        return res.status(404).json({
          success: false,
          message: 'Staff credentials not found'
        });
      }
      
      const staff = staffResult[0];
      
      // Verify current password
      let isValidPassword = false;
      
      try {
        if (staff.password?.startsWith('$2b$') || staff.password?.startsWith('$2a$')) {
          isValidPassword = await bcrypt.compare(currentPassword, staff.password);
        } else {
          isValidPassword = currentPassword === staff.password;
          console.log('⚠️ Staff has legacy plain text password, will be upgraded to bcrypt');
        }
      } catch (error) {
        console.error('❌ Staff password verification error:', error);
        isValidPassword = false;
      }
      
      if (!isValidPassword) {
        console.log('❌ Current password incorrect for staff:', staffId);
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await connection.execute(
        `UPDATE ${tableName} SET password = ? WHERE ${idColumn} = ?`,
        [hashedPassword, staffId]
      );
      
      console.log('✅ Password changed successfully for staff:', staffId);
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    }
    
    // Unknown user type
    return res.status(400).json({
      success: false,
      message: 'Unable to determine user type for password change'
    });
    
  } catch (error) {
    console.error('❌ Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing password. Please try again.'
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

export default { mobileChangePassword };

