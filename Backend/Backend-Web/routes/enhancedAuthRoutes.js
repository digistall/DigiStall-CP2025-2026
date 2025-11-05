// ===== ENHANCED AUTHENTICATION ROUTES =====
// Complete JWT authentication with refresh tokens
// Routes: /login, /logout, /refresh, /verify-token, /me

import express from 'express';
import enhancedAuthMiddleware from '../middleware/enhancedAuth.js';
import {
  login,
  refreshToken,
  logout,
  verifyToken,
  getCurrentUser
} from '../controllers/auth/enhancedAuthController.js';

// Legacy authentication (for backward compatibility)
import {
  adminLogin,
  branchManagerLogin,
  createAdminUser,
  createPasswordHash,
  testDb
} from '../controllers/auth/loginController.js';

const router = express.Router();

// ===== ENHANCED JWT AUTHENTICATION ENDPOINTS =====

// Public routes (no authentication required)
router.post('/login', login);                           // POST /api/auth/login - Login with email/password
router.post('/refresh', refreshToken);                  // POST /api/auth/refresh - Refresh access token
router.get('/verify-token', verifyToken);               // GET /api/auth/verify-token - Verify token validity

// Utility endpoints (public)
router.post('/create-admin', createAdminUser);          // POST /api/auth/create-admin - Create admin user
router.post('/hash-password', createPasswordHash);      // POST /api/auth/hash-password - Generate password hash
router.get('/test-db', testDb);                        // GET /api/auth/test-db - Test database connection

// Protected routes (require authentication)
router.use(enhancedAuthMiddleware.authenticateToken);   // Apply auth middleware to routes below

router.post('/logout', logout);                         // POST /api/auth/logout - Logout and revoke tokens
router.get('/me', getCurrentUser);                      // GET /api/auth/me - Get current user info

// ===== LEGACY ENDPOINTS (Backward Compatibility) =====
router.post('/admin/login', adminLogin);                // POST /api/auth/admin/login - Admin login (legacy)
router.post('/branch_manager/login', branchManagerLogin); // POST /api/auth/branch_manager/login - Branch manager login (legacy)
router.get('/branch-manager-info', getCurrentUser);     // GET /api/auth/branch-manager-info - Get branch manager info (alias)
router.get('/admin-info', getCurrentUser);              // GET /api/auth/admin-info - Get admin info (alias)

export default router;
