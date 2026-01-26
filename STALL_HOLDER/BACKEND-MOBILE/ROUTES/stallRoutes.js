import express from 'express'
import {
  getAllStalls,
  getStallsByType,
  getStallsByArea,
  getStallById,
  getAvailableAreas,
  searchStalls,
  getStallImages
} from '../CONTROLLERS/stallController.js'

// Import BLOB image controller from BUSINESS_OWNER (shared functionality)
import {
  uploadStallImageBlob,
  getStallImageBlobById,
  getStallImagesBlob,
  getStallPrimaryImageBlob
} from '../../../BUSINESS_OWNER/BACKEND-WEB/CONTROLLERS/stallImageBlobController.js'

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

// Get all images for a stall (metadata from DB)
// GET /mobile/api/stalls/images/:stall_id
router.get('/images/:stall_id', getStallImages)

// ===== BLOB IMAGE ROUTES (Cloud Storage) =====
// Get image binary by ID (serves actual image)
// GET /mobile/api/stalls/images/blob/id/:image_id
router.get('/images/blob/id/:image_id', getStallImageBlobById)

// Get primary image for stall (serves actual image)
// GET /mobile/api/stalls/images/blob/primary/:stall_id
router.get('/images/blob/primary/:stall_id', getStallPrimaryImageBlob)

// Get all images for stall (metadata with optional base64)
// GET /mobile/api/stalls/:stall_id/images/blob?include_data=true
router.get('/:stall_id/images/blob', getStallImagesBlob)

// Upload image as base64 (requires auth in production)
// POST /mobile/api/stalls/images/blob/upload
router.post('/images/blob/upload', uploadStallImageBlob)

// Get stall details by ID
// GET /mobile/api/stalls/123?applicant_id=456
router.get('/:id', getStallById)

// Search stalls with filters - restricted to applicant's applied areas
// GET /mobile/api/stalls/search?applicant_id=123&type=Auction&area=Naga City&min_price=1000&max_price=5000 (applicant_id REQUIRED)
router.get('/search', searchStalls)

export default router