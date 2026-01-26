import express from 'express'
import jwt from 'jsonwebtoken'
import { mobileLogin, submitApplication } from '../CONTROLLERS/loginController.js'
import { mobileStaffLogin, mobileStaffLogout, mobileStaffHeartbeat, mobileStaffAutoLogout } from '../../../EMPLOYEE/INSPECTOR/BACKEND-MOBILE/CONTROLLERS/mobileStaffAuthController.js'
import { verifyToken } from '../../../SHARED/MIDDLEWARE/mobileAuth.js'

const router = express.Router()

// Mobile login route - POST /login (matches mobile app expectation)
router.post('/login', mobileLogin)

// Mobile staff login route - POST /staff-login (Inspector/Collector login)
router.post('/staff-login', mobileStaffLogin)

// Mobile application submission route - POST /submit-application (legacy endpoint)
router.post('/submit-application', submitApplication)

// ===== MOBILE VERIFY TOKEN =====
// GET /api/mobile/auth/verify-token - Verify if JWT token is still valid
router.get('/verify-token', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digistall-mobile-secret-key-2024');
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: decoded
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Protected routes (require auth)
router.post('/staff-logout', verifyToken, mobileStaffLogout)
router.post('/staff-heartbeat', verifyToken, mobileStaffHeartbeat)
router.post('/staff-auto-logout', verifyToken, mobileStaffAutoLogout)

export default router