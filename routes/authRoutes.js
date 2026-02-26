import express from 'express'
import { verifyToken } from '../middleware/auth.js';

// Import mobile login controller with full data fetching (including spouse, business, stallholder data)
import { mobileLogin } from '../SHARE-CONTROLLER/login/loginController.js'

// Import other mobile-specific auth controllers
import { 
  mobileRegister,
  mobileVerifyToken,
  mobileLogout 
} from '../SHARE-CONTROLLER/mobileAuthController.js'

// Import mobile staff auth controller (inspector/collector)
import { 
  mobileStaffLogin, 
  mobileStaffLogout,
  mobileStaffHeartbeat,
  mobileStaffAutoLogout 
} from '../SHARE-CONTROLLER/mobileStaffAuthController.js'

// Import change password controller
import { mobileChangePassword } from '../SHARE-CONTROLLER/mobileChangePasswordController.js'

// Import password reset controllers
import { verifyEmailExists, resendResetCode, verifyResetCode, resetPassword } from '../SHARE-CONTROLLER/auth/passwordResetController.js'

const router = express.Router()

// ===== MOBILE AUTHENTICATION ROUTES =====
router.post('/login', mobileLogin)                       // POST /mobile/auth/login - Mobile user login with full data
router.post('/staff-login', mobileStaffLogin)            // POST /mobile/auth/staff-login - Inspector/Collector login
router.post('/register', mobileRegister)                 // POST /mobile/auth/register - Mobile user registration
router.get('/verify-token', mobileVerifyToken)           // GET /mobile/auth/verify-token - Verify mobile token

// ===== PASSWORD RESET ROUTES (Public - no auth required) =====
router.post('/verify-email-exists', verifyEmailExists)   // POST /mobile/auth/verify-email-exists - Check if email is registered
router.post('/send-reset-code', resendResetCode)         // POST /mobile/auth/send-reset-code - Send OTP to email
router.post('/verify-reset-code', verifyResetCode)       // POST /mobile/auth/verify-reset-code - Verify OTP code
router.post('/reset-password', resetPassword)            // POST /mobile/auth/reset-password - Set new password

// ===== PROTECTED MOBILE ROUTES =====
router.use(verifyToken) // Apply auth middleware to routes below
router.post('/logout', mobileLogout)                     // POST /mobile/auth/logout - Mobile user logout
router.post('/staff-logout', mobileStaffLogout)          // POST /mobile/auth/staff-logout - Inspector/Collector logout
router.post('/staff-heartbeat', mobileStaffHeartbeat)    // POST /mobile/auth/staff-heartbeat - Keep staff marked as online
router.post('/staff-auto-logout', mobileStaffAutoLogout) // POST /mobile/auth/staff-auto-logout - Auto-logout due to inactivity
router.post('/change-password', mobileChangePassword)    // POST /mobile/auth/change-password - Change user password

export default router
