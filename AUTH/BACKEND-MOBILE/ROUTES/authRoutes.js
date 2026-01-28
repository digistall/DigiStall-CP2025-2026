import express from 'express';
import {
  mobileLogin,
  mobileLogout,
  verifyMobileToken,
  refreshMobileToken
} from '../CONTROLLERS/mobileAuthController.js';
import {
  changePassword,
  requestPasswordReset,
  validateResetToken,
  resetPassword
} from '../CONTROLLERS/mobileChangePasswordController.js';

const router = express.Router();

/**
 * AUTH - Mobile Authentication Routes
 * All routes for mobile user authentication
 */

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// Login
router.post('/login', mobileLogin);

// Password reset flow
router.post('/password/request-reset', requestPasswordReset);
router.post('/password/validate-token', validateResetToken);
router.post('/password/reset', resetPassword);

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Token verification & refresh
router.get('/verify', verifyMobileToken);
router.post('/refresh', refreshMobileToken);

// Logout
router.post('/logout', mobileLogout);

// Change password (requires auth)
router.post('/password/change', changePassword);

export default router;
