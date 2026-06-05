import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import {
  // Unified authentication
  login,
  verifyToken as verifyTokenHandler,
  getCurrentUser,
  updateProfile
} from '../BACKEND/AUTH/auth/unifiedAuthController.js'

// Import logout and heartbeat from enhanced auth controller
import { logout, heartbeat } from '../BACKEND/AUTH/auth/enhancedAuthController.js'

// Legacy authentication (for backward compatibility)
import {
  adminLogin,
  branchManagerLogin,
  createAdminUser,
  createPasswordHash,
  testDb
} from '../BACKEND/AUTH/auth/loginController.js'

// Import password reset controller
import passwordResetController from '../BACKEND/AUTH/auth/passwordResetController.js'

// Import validation schemas
import { validate } from '../middleware/validateRequest.js';
import {
  loginSchema, verifyEmailSchema, storeResetCodeSchema,
  verifyResetCodeSchema, resendResetCodeSchema, resetPasswordSchema,
  logoutSchema, heartbeatSchema, updateProfileSchema,
  createBusinessOwnerSchema, hashPasswordSchema
} from '../middleware/schemas/authSchemas.js';

const router = express.Router()

// ===== PASSWORD RESET ENDPOINTS (Public) =====
router.post('/verify-email-exists', authLimiter, validate(verifyEmailSchema), passwordResetController.verifyEmailExists)
router.post('/store-reset-code', authLimiter, validate(storeResetCodeSchema), passwordResetController.storeResetCode)
router.post('/resend-reset-code', authLimiter, validate(resendResetCodeSchema), passwordResetController.resendResetCode)
router.post('/verify-reset-code', authLimiter, validate(verifyResetCodeSchema), passwordResetController.verifyResetCode)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), passwordResetController.resetPassword)

// ===== UNIFIED AUTHENTICATION ENDPOINTS =====
// Single clean login endpoint for all user types
router.post('/login', authLimiter, validate(loginSchema), login)                            // POST /api/auth/login - Unified login (system_administrator, stall_business_owner, business_manager, business_employee)
router.get('/verify-token', verifyTokenHandler)         // GET /api/auth/verify-token - Verify JWT token

// ===== LEGACY ENDPOINTS (Backward Compatibility) =====
router.post('/business-owner/login', authLimiter, validate(loginSchema), adminLogin)                 // POST /api/auth/business-owner/login - Business Owner login (legacy)
router.post('/business-manager/login', authLimiter, validate(loginSchema), branchManagerLogin) // POST /api/auth/business-manager/login - Business Manager login (legacy)

// ===== UTILITY ENDPOINTS =====
router.post('/create-business-owner', authLimiter, validate(createBusinessOwnerSchema), createAdminUser)           // POST /api/auth/create-business-owner - Create business owner user
router.post('/hash-password', authLimiter, validate(hashPasswordSchema), createPasswordHash)       // POST /api/auth/hash-password - Create password hash
router.get('/test-db', testDb)                         // GET /api/auth/test-db - Test database connection

// ===== PUBLIC LOGOUT ROUTE =====
// Logout doesn't require auth - it uses request body to identify user
router.post('/logout', validate(logoutSchema), logout)                         // POST /api/auth/logout - Logout

// ===== ACTIVITY HEARTBEAT =====
// Updates last_login to keep user marked as "online"
router.post('/heartbeat', validate(heartbeatSchema), heartbeat)                   // POST /api/auth/heartbeat - Activity heartbeat

// ===== PROTECTED ROUTES =====
router.use(authMiddleware.authenticateToken) // Apply auth middleware to routes below
router.get('/me', getCurrentUser)                      // GET /api/auth/me - Get current user info
router.get('/business-manager-info', getCurrentUser)    // GET /api/auth/business-manager-info - Get business manager info (alias for backward compatibility)
router.get('/business-owner-info', getCurrentUser)             // GET /api/auth/business-owner-info - Get business owner info (alias for backward compatibility)
router.put('/profile/update', validate(updateProfileSchema), updateProfile)          // PUT /api/auth/profile/update - Update profile

export default router
