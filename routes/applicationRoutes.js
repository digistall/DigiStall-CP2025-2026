import express from 'express'
import { verifyToken } from '../middleware/auth.js'

// Import mobile application controllers
import { 
  submitMobileApplication,
  getMobileUserApplications,
  getMobileApplicationStatus,
  updateMobileApplication,
  joinRaffle,
  joinAuction
} from '../controllers/mobileApplicationController.js'

const router = express.Router()

// ===== PUBLIC MOBILE APPLICATION ROUTES =====
router.post('/submit', submitMobileApplication)           // POST /api/mobile/applications/submit - Submit application from mobile
router.post('/join-raffle', joinRaffle)                   // POST /api/mobile/applications/join-raffle - Join a raffle
router.post('/join-auction', joinAuction)                 // POST /api/mobile/applications/join-auction - Join an auction

// ===== PROTECTED MOBILE ROUTES =====
router.use(verifyToken) // Apply auth middleware to routes below
router.get('/my', getMobileUserApplications)             // GET /mobile/applications/my - Get user's applications
router.get('/:id/status', getMobileApplicationStatus)    // GET /mobile/applications/:id/status - Get application status
router.put('/:id', updateMobileApplication)              // PUT /mobile/applications/:id - Update application

export default router