import express from 'express'
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

// Import mobile login controller with full data fetching (including spouse, business, stallholder data)
import { mobileLogin } from '../BACKEND/AUTH/login/loginController.js'
import { vendorLogin } from '../BACKEND/AUTH/vendorAuthController.js'

// Import other mobile-specific auth controllers
import { 
  mobileRegister,
  mobileVerifyToken,
  mobileLogout 
} from '../BACKEND/AUTH/mobileAuthController.js'

// Import mobile staff auth controller (inspector/collector)
import { 
  mobileStaffLogin, 
  mobileStaffLogout,
  mobileStaffHeartbeat,
  mobileStaffAutoLogout 
} from '../BACKEND/AUTH/mobileStaffAuthController.js'

// Import change password controller
import { mobileChangePassword } from '../BACKEND/AUTH/mobileChangePasswordController.js'

const router = express.Router()

/**
 * Optional token verifier — used ONLY for the logout route.
 * Tries to decode the JWT from the Authorization header using every known
 * fallback secret. If decoding fails (expired, bad secret, missing), it still
 * calls next() so the logout handler always runs. req.user will be null if
 * decoding fails, and the logout controller handles that gracefully.
 */
const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // Try each known secret in priority order (for backward compatibility with old sessions)
    const secrets = [
      process.env.JWT_SECRET,
      'digistall-mobile-secret-key-2024',
      'your-super-secret-jwt-key-change-this-in-production',
      'your-secret-key',
    ].filter(Boolean);

    for (const secret of secrets) {
      try {
        const decoded = jwt.verify(token, secret);
        req.user = {
          userId:    decoded.userId    || decoded.applicantId || decoded.id,
          username:  decoded.username  || decoded.email || 'Unknown',
          fullName:  decoded.fullName  || decoded.full_name || null,
          userType:  decoded.userType  || decoded.type || decoded.role,
          stallholderId: decoded.stallholderId || null,
          branchId:  decoded.branchId  || null
        };
        break; // stop at first successful decode
      } catch (_) {
        // try next secret
      }
    }

    // If all secrets fail, also attempt an UNVERIFIED decode to at least
    // extract the payload (so we can still log who logged out)
    if (!req.user) {
      try {
        const unverified = jwt.decode(token);
        if (unverified) {
          req.user = {
            userId:    unverified.userId    || unverified.applicantId || unverified.id,
            username:  unverified.username  || unverified.email || 'Unknown',
            fullName:  unverified.fullName  || unverified.full_name  || null,
            userType:  unverified.userType  || unverified.type || unverified.role,
            stallholderId: unverified.stallholderId || null,
            branchId:  unverified.branchId  || null
          };
          console.log('📱 Logout: token could not be verified but was decoded for logging purposes');
        }
      } catch (_) {
        // ignore — req.user stays null
      }
    }
  }

  next(); // always continue — logout must never be blocked
};

// ===== MOBILE AUTHENTICATION ROUTES =====
router.post('/login', authLimiter, mobileLogin)                       // POST /mobile/auth/login - Mobile user login with full data
router.post('/staff-login', authLimiter, mobileStaffLogin)            // POST /mobile/auth/staff-login - Inspector/Collector login
router.post('/vendor-login', authLimiter, vendorLogin)                // POST /mobile/auth/vendor-login - Vendor login
router.post('/register', authLimiter, mobileRegister)                 // POST /mobile/auth/register - Mobile user registration
router.get('/verify-token', mobileVerifyToken)           // GET /mobile/auth/verify-token - Verify mobile token

// Logout uses optional token verification — never blocked by auth failures
router.post('/logout', optionalVerifyToken, mobileLogout) // POST /mobile/auth/logout - Mobile user logout

// ===== PROTECTED MOBILE ROUTES =====
router.use(verifyToken) // Apply strict auth middleware to routes below
router.post('/staff-logout', mobileStaffLogout)          // POST /mobile/auth/staff-logout - Inspector/Collector logout
router.post('/staff-heartbeat', mobileStaffHeartbeat)    // POST /mobile/auth/staff-heartbeat - Keep staff marked as online
router.post('/staff-auto-logout', mobileStaffAutoLogout) // POST /mobile/auth/staff-auto-logout - Auto-logout due to inactivity
router.post('/change-password', authLimiter, mobileChangePassword)    // POST /mobile/auth/change-password - Change user password

export default router
