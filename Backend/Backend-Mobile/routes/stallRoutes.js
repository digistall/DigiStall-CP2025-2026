import express from 'express'
import {
  getAllStalls,
  getStallsByType,
  getStallsByArea,
  getStallById,
  getAvailableAreas,
  searchStalls
} from '../controllers/stall/stallController.js'

const router = express.Router()

// Get all available stalls (restricted to applicant's applied areas)
// GET /mobile/api/stalls?applicant_id=123 (applicant_id REQUIRED)
router.get('/', getAllStalls)

// Get stalls by type (Fixed Price, Raffle, Auction) - restricted to applicant's applied areas
// GET /mobile/api/stalls/type/Auction?applicant_id=123 (applicant_id REQUIRED)
router.get('/type/:type', getStallsByType)

// Get stalls by area - restricted to applicant's applied areas
// GET /mobile/api/stalls/area/Naga City?applicant_id=123&type=Auction (applicant_id REQUIRED)
router.get('/area/:area', getStallsByArea)

// Get stall details by ID
// GET /mobile/api/stalls/123?applicant_id=456
router.get('/:id', getStallById)

// Search stalls with filters - restricted to applicant's applied areas
// GET /mobile/api/stalls/search?applicant_id=123&type=Auction&area=Naga City&min_price=1000&max_price=5000 (applicant_id REQUIRED)
router.get('/search', searchStalls)

export default router