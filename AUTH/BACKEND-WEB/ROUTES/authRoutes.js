import express from 'express';
import {
  unifiedLogin,
  unifiedLogout,
  verifyToken,
  refreshToken,
  getAuthStatus
} from '../CONTROLLERS/unifiedAuthController.js';
import {
  enhancedLogin,
  enhancedLogout
} from '../CONTROLLERS/enhancedAuthController.js';
import authMiddleware from '../../../SHARED/MIDDLEWARE/auth.js';

const router = express.Router();

/**
 * AUTH - Web Authentication Routes
 * All routes for web user authentication
 */

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// Unified login (handles all user types)
router.post('/login', unifiedLogin);

// Enhanced login with additional features
router.post('/enhanced-login', enhancedLogin);

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Token verification & refresh
router.get('/verify', authMiddleware, verifyToken);
router.post('/refresh', refreshToken);

// Get authentication status
router.get('/status', authMiddleware, getAuthStatus);

// Logout
router.post('/logout', authMiddleware, unifiedLogout);
router.post('/enhanced-logout', authMiddleware, enhancedLogout);

export default router;
