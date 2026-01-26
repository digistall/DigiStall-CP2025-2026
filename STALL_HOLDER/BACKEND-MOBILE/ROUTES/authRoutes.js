import express from 'express'
import { verifyToken } from '../../../SHARED/MIDDLEWARE/mobileAuth.js';

// Import mobile login controller with full data fetching (including spouse, business, stallholder data)
import { mobileLogin } from '../CONTROLLERS/loginController.js'

// Import other mobile-specific auth controllers
import { 
  mobileRegister,
  mobileVerifyToken,
  mobileLogout 
} from '../CONTROLLERS/mobileAuthController.js'

// Import mobile staff auth controller (inspector/collector) from EMPLOYEE folder
import { 
  mobileStaffLogin, 
  mobileStaffLogout,
  mobileStaffHeartbeat,
  mobileStaffAutoLogout 
} from '../../../EMPLOYEE/INSPECTOR/BACKEND-MOBILE/CONTROLLERS/mobileStaffAuthController.js'

// Change password is handled by mobileAuthController
const mobileChangePassword = async (req, res) => {
  // Placeholder - implement in mobileAuthController if needed
  res.status(501).json({ message: 'Change password not implemented' });
};

const router = express.Router()

// ===== MOBILE AUTHENTICATION ROUTES =====
router.post('/login', mobileLogin)                       // POST /mobile/auth/login - Mobile user login with full data
router.post('/staff-login', mobileStaffLogin)            // POST /mobile/auth/staff-login - Inspector/Collector login
router.post('/register', mobileRegister)                 // POST /mobile/auth/register - Mobile user registration
router.get('/verify-token', mobileVerifyToken)           // GET /mobile/auth/verify-token - Verify mobile token

// ===== PROTECTED MOBILE ROUTES =====
router.use(verifyToken) // Apply auth middleware to routes below
router.post('/logout', mobileLogout)                     // POST /mobile/auth/logout - Mobile user logout
router.post('/staff-logout', mobileStaffLogout)          // POST /mobile/auth/staff-logout - Inspector/Collector logout
router.post('/staff-heartbeat', mobileStaffHeartbeat)    // POST /mobile/auth/staff-heartbeat - Keep staff marked as online
router.post('/staff-auto-logout', mobileStaffAutoLogout) // POST /mobile/auth/staff-auto-logout - Auto-logout due to inactivity
router.post('/change-password', mobileChangePassword)    // POST /mobile/auth/change-password - Change user password

export default router