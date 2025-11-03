import express from 'express'
import authMiddleware from '../../middleware/auth.js'

// Import mobile login controller with full data fetching
import { mobileLogin } from '../controllers/login/loginController.js'

// Import other mobile-specific auth controllers
import { 
  mobileRegister,
  mobileVerifyToken,
  mobileLogout 
} from '../controllers/mobileAuthController.js'

const router = express.Router()

// ===== MOBILE AUTHENTICATION ROUTES =====
router.post('/login', mobileLogin)                       // POST /mobile/auth/login - Mobile user login with full data
router.post('/register', mobileRegister)                 // POST /mobile/auth/register - Mobile user registration
router.get('/verify-token', mobileVerifyToken)           // GET /mobile/auth/verify-token - Verify mobile token

// ===== PROTECTED MOBILE ROUTES =====
router.use(authMiddleware.authenticateToken) // Apply auth middleware to routes below
router.post('/logout', mobileLogout)                     // POST /mobile/auth/logout - Mobile logout

export default router