// ===== ENHANCED AUTHENTICATION ROUTES =====
// Complete JWT authentication with refresh tokens
// Routes: /login, /logout, /refresh, /verify-token, /me, /auto-logout

import express from 'express';
import enhancedAuthMiddleware from '../middleware/enhancedAuth.js';
import {
  login,
  refreshToken,
  logout,
  verifyToken,
  getCurrentUser,
  autoLogout,
  heartbeat
} from '../SHARE-CONTROLLER/auth/enhancedAuthController.js';

// Legacy authentication (for backward compatibility)
import {
  adminLogin,
  branchManagerLogin,
  createAdminUser,
  createPasswordHash,
  testDb
} from '../SHARE-CONTROLLER/auth/loginController.js';

// Import password reset controller
import passwordResetController from '../SHARE-CONTROLLER/auth/passwordResetController.js';

const router = express.Router();

// ===== PASSWORD RESET ENDPOINTS (Public) =====
router.post('/verify-email-exists', passwordResetController.verifyEmailExists);
router.post('/store-reset-code', passwordResetController.storeResetCode);
router.post('/resend-reset-code', passwordResetController.resendResetCode);
router.post('/verify-reset-code', passwordResetController.verifyResetCode);
router.post('/reset-password', passwordResetController.resetPassword);

// ===== ENHANCED JWT AUTHENTICATION ENDPOINTS =====

// Public routes (no authentication required)
router.post('/login', login);                           // POST /api/auth/login - Login with email/password
router.post('/refresh', refreshToken);                  // POST /api/auth/refresh - Refresh access token
router.get('/verify-token', verifyToken);               // GET /api/auth/verify-token - Verify token validity

// Utility endpoints (public)
router.post('/create-business-owner', createAdminUser);          // POST /api/auth/create-business-owner - Create business owner user
router.post('/hash-password', createPasswordHash);      // POST /api/auth/hash-password - Generate password hash
router.get('/test-db', testDb);                        // GET /api/auth/test-db - Test database connection

// Protected routes (require authentication)
router.use(enhancedAuthMiddleware.authenticateToken);   // Apply auth middleware to routes below

router.post('/logout', logout);                         // POST /api/auth/logout - Logout and revoke tokens
router.post('/auto-logout', autoLogout);                // POST /api/auth/auto-logout - Auto-logout due to inactivity
router.post('/heartbeat', heartbeat);                   // POST /api/auth/heartbeat - Keep user marked as online
router.get('/me', getCurrentUser);                      // GET /api/auth/me - Get current user info

// ===== LEGACY ENDPOINTS (Backward Compatibility) =====
router.post('/business-owner/login', adminLogin);                // POST /api/auth/business-owner/login - Business Owner login (legacy)
router.post('/business-manager/login', branchManagerLogin); // POST /api/auth/business-manager/login - Business Manager login (legacy)
router.get('/business-manager-info', getCurrentUser);     // GET /api/auth/business-manager-info - Get business manager info (alias)
router.get('/business-owner-info', getCurrentUser);              // GET /api/auth/business-owner-info - Get business owner info (alias)

export default router;
