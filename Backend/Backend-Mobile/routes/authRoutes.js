import express from 'express'
import { verifyToken } from '../middleware/auth.js';

// Import mobile login controller with full data fetching (including spouse, business, stallholder data)
import { mobileLogin } from '../controllers/login/loginController.js'

// Import other mobile-specific auth controllers
import { 
  mobileRegister,
  mobileVerifyToken,
  mobileLogout 
} from '../controllers/mobileAuthController.js'

// Import mobile staff auth controller (inspector/collector)
import { mobileStaffLogin } from '../controllers/mobileStaffAuthController.js'

const router = express.Router()

// ===== MOBILE AUTHENTICATION ROUTES =====
router.post('/login', mobileLogin)                       // POST /mobile/auth/login - Mobile user login with full data
router.post('/staff-login', mobileStaffLogin)            // POST /mobile/auth/staff-login - Inspector/Collector login
router.post('/register', mobileRegister)                 // POST /mobile/auth/register - Mobile user registration
router.get('/verify-token', mobileVerifyToken)           // GET /mobile/auth/verify-token - Verify mobile token

// ===== PROTECTED MOBILE ROUTES =====
router.use(verifyToken) // Apply auth middleware to routes below
router.post('/logout', mobileLogout)                     // POST /mobile/auth/logout - Mobile logout

export default router