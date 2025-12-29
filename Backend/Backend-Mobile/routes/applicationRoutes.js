import express from 'express'
import authMiddleware from '../middleware/auth.js'

// Import mobile application controllers
import { 
  submitMobileApplication,
  getMobileUserApplications,
  getMobileApplicationStatus,
  updateMobileApplication 
} from '../controllers/mobileApplicationController.js'

const router = express.Router()

// ===== PUBLIC MOBILE APPLICATION ROUTES =====
router.post('/submit', submitMobileApplication)           // POST /mobile/applications/submit - Submit application from mobile

// ===== PROTECTED MOBILE ROUTES =====
router.use(authMiddleware.authenticateToken) // Apply auth middleware to routes below
router.get('/my', getMobileUserApplications)             // GET /mobile/applications/my - Get user's applications
router.get('/:id/status', getMobileApplicationStatus)    // GET /mobile/applications/:id/status - Get application status
router.put('/:id', updateMobileApplication)              // PUT /mobile/applications/:id - Update application

export default router