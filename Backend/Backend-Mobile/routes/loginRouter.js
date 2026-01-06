import express from 'express'
import { mobileLogin, submitApplication } from '../controllers/login/loginController.js'
import { mobileStaffLogin, mobileStaffLogout, mobileStaffHeartbeat, mobileStaffAutoLogout } from '../controllers/mobileStaffAuthController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Mobile login route - POST /login (matches mobile app expectation)
router.post('/login', mobileLogin)

// Mobile staff login route - POST /staff-login (Inspector/Collector login)
router.post('/staff-login', mobileStaffLogin)

// Mobile application submission route - POST /submit-application (legacy endpoint)
router.post('/submit-application', submitApplication)

// Protected routes (require auth)
router.post('/staff-logout', verifyToken, mobileStaffLogout)
router.post('/staff-heartbeat', verifyToken, mobileStaffHeartbeat)
router.post('/staff-auto-logout', verifyToken, mobileStaffAutoLogout)

export default router