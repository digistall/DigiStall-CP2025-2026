import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  // Unified authentication
  login,
  verifyToken as verifyTokenHandler,
  getCurrentUser
} from '../SHARE-CONTROLLER/auth/unifiedAuthController.js'

// Import logout and heartbeat from enhanced auth controller
import { logout, heartbeat } from '../SHARE-CONTROLLER/auth/enhancedAuthController.js'

// Import password reset functions
import {
  verifyEmailExists,
  storeResetCode,
  resendResetCode,
  verifyResetCode,
  resetPassword
} from '../SHARE-CONTROLLER/auth/passwordResetController.js'

// Legacy authentication (for backward compatibility)
import {
  adminLogin,
  branchManagerLogin,
  createAdminUser,
  createPasswordHash,
  testDb
} from '../SHARE-CONTROLLER/auth/loginController.js'

const router = express.Router()

// ===== UNIFIED AUTHENTICATION ENDPOINTS =====
// Single clean login endpoint for all user types
router.post('/login', login)                            // POST /api/auth/login - Unified login (system_administrator, stall_business_owner, business_manager, business_employee)
router.get('/verify-token', verifyTokenHandler)         // GET /api/auth/verify-token - Verify JWT token

// ===== LEGACY ENDPOINTS (Backward Compatibility) =====
router.post('/business-owner/login', adminLogin)                 // POST /api/auth/business-owner/login - Business Owner login (legacy)
router.post('/business-manager/login', branchManagerLogin) // POST /api/auth/business-manager/login - Business Manager login (legacy)

// ===== UTILITY ENDPOINTS =====
router.post('/create-business-owner', createAdminUser)           // POST /api/auth/create-business-owner - Create business owner user
router.post('/hash-password', createPasswordHash)       // POST /api/auth/hash-password - Create password hash
router.get('/test-db', testDb)                         // GET /api/auth/test-db - Test database connection

// ===== PASSWORD RESET ENDPOINTS =====
router.post('/verify-email-exists', verifyEmailExists)  // POST /api/auth/verify-email-exists - Verify email & send code
router.post('/resend-reset-code', resendResetCode)      // POST /api/auth/resend-reset-code - Resend verification code
router.post('/store-reset-code', storeResetCode)        // POST /api/auth/store-reset-code - Store password reset code (legacy)
router.post('/verify-reset-code', verifyResetCode)      // POST /api/auth/verify-reset-code - Verify reset code entered by user
router.post('/reset-password', resetPassword)           // POST /api/auth/reset-password - Reset user password

// ===== PUBLIC LOGOUT ROUTE =====
// Logout doesn't require auth - it uses request body to identify user
router.post('/logout', logout)                         // POST /api/auth/logout - Logout

// ===== ACTIVITY HEARTBEAT =====
// Updates last_login to keep user marked as "online"
router.post('/heartbeat', heartbeat)                   // POST /api/auth/heartbeat - Activity heartbeat

// ===== PROTECTED ROUTES =====
router.use(authMiddleware.authenticateToken) // Apply auth middleware to routes below
router.get('/me', getCurrentUser)                      // GET /api/auth/me - Get current user info
router.get('/business-manager-info', getCurrentUser)    // GET /api/auth/business-manager-info - Get business manager info (alias for backward compatibility)
router.get('/business-owner-info', getCurrentUser)             // GET /api/auth/business-owner-info - Get business owner info (alias for backward compatibility)

export default router
