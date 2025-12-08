import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  // Unified authentication
  login,
  verifyToken as verifyTokenHandler,
  getCurrentUser,
  logout
} from '../controllers/auth/unifiedAuthController.js'

// Legacy authentication (for backward compatibility)
import {
  adminLogin,
  branchManagerLogin,
  createAdminUser,
  createPasswordHash,
  testDb
} from '../controllers/auth/loginController.js'

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

// ===== PROTECTED ROUTES =====
router.use(authMiddleware.authenticateToken) // Apply auth middleware to routes below
router.post('/logout', logout)                         // POST /api/auth/logout - Logout
router.get('/me', getCurrentUser)                      // GET /api/auth/me - Get current user info
router.get('/business-manager-info', getCurrentUser)    // GET /api/auth/business-manager-info - Get business manager info (alias for backward compatibility)
router.get('/business-owner-info', getCurrentUser)             // GET /api/auth/business-owner-info - Get business owner info (alias for backward compatibility)

export default router