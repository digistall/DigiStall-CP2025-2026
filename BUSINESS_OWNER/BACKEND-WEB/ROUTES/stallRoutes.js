import express from 'express'
import authMiddleware from '../../../SHARED/MIDDLEWARE/auth.js'
import activityLogger from '../../../SHARED/MIDDLEWARE/activityLogger.js'
import { viewOnlyForOwners } from '../../../SHARED/MIDDLEWARE/rolePermissions.js'
import {
  // Core stall management (Admin)
  addStall,
  getAllStalls,
  getAvailableStalls,
  getStallById,
  getStallsByFilter,
  updateStall,
  deleteStall,
  
  // Landing page functions (Public)
  getBranches,
  getAvailableAreas,
  getAvailableMarkets,
  getLocationsByArea,
  getStallsByArea,
  getStallsByLocation,
  getFilteredStalls,
  getLandingPageStats,
  getLandingPageStallholders,
  getLandingPageStallsList,
  getLandingPageFilterOptions,
  
  // Raffle management
  createRaffle,
  joinRaffle,
  getActiveRaffles,
  getRaffleDetails,
  getRaffleParticipantsByStall,
  extendRaffleTimer,
  cancelRaffle,
  selectRaffleWinner,
  autoSelectWinnerForExpiredRaffles,
  
  // Auction management
  createAuction,
  placeBid,
  getActiveAuctions,
  getAuctionDetails,
  getAuctionParticipantsByStall,
  extendAuctionTimer,
  cancelAuction,
  selectAuctionWinner,
  autoSelectWinnerForExpiredAuctions
} from '../CONTROLLERS/stallController.js'

// Import stall image controller
import {
  uploadStallImages,
  getStallImages,
  deleteStallImage,
  deleteStallImageByFilename,
  setStallPrimaryImage,
  getStallImageCount
} from '../CONTROLLERS/stallImageController.js'

// Import BLOB image controller for cloud storage
import {
  uploadStallImageBlob,
  uploadStallImagesBlob,
  getStallImageBlob,
  getStallImageBlobById,
  getStallImagesBlob,
  deleteStallImageBlob,
  deleteLegacyStallImage,
  setStallPrimaryImageBlob,
  updateStallImageBlob,
  getStallPrimaryImageBlob
} from '../CONTROLLERS/stallImageBlobController.js'

// Import new addStall with images
import { addStallWithImages } from '../CONTROLLERS/stallComponents/addStallWithImages.js'

// Import multer configuration
import upload, { checkImageLimit } from '../../../SHARED/CONFIG/multerStallImages.js'
import multer from 'multer'

// Temporary upload for addStall - Configure with large limits for base64 images
// Base64 encoding increases size by ~33%, so 100MB allows ~75MB of actual images
const tempUpload = multer({ 
  dest: 'uploads/temp/',
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100MB for base64 image fields (handles ~75MB of images)
    fileSize: 100 * 1024 * 1024,  // 100MB for file uploads
    fields: 100,                   // Allow many fields
    files: 10                      // Max 10 files
  }
})

const router = express.Router()

// ===== PUBLIC ROUTES (No Authentication) =====
// Landing page stall browsing
router.get('/stats', getLandingPageStats)               // GET /api/stalls/stats - Get landing page statistics (public)
router.get('/public/stallholders', getLandingPageStallholders)  // GET /api/stalls/public/stallholders - Get stallholders list (public)
router.get('/public/list', getLandingPageStallsList)    // GET /api/stalls/public/list - Get stalls list (public)
router.get('/public/filter-options', getLandingPageFilterOptions)  // GET /api/stalls/public/filter-options - Get filter options (public)
router.get('/branches', getBranches)                    // GET /api/stalls/branches - Get all branches (public)
router.get('/areas', getAvailableAreas)                 // GET /api/stalls/areas - Get available areas (public)
router.get('/markets', getAvailableMarkets)             // GET /api/stalls/markets - Get available markets (public)
router.get('/locations', getLocationsByArea)            // GET /api/stalls/locations?branch=X or ?area=X - Get locations by area/branch (public)
router.get('/by-branch', getStallsByArea)               // GET /api/stalls/by-branch?branch=X - Get stalls by branch (public)
router.get('/area/:area', getStallsByArea)              // GET /api/stalls/area/:area - Get stalls by area (public)
router.get('/location/:location', getStallsByLocation)  // GET /api/stalls/location/:location - Get stalls by location (public)
router.get('/filter', getFilteredStalls)                // GET /api/stalls/filter - Get filtered stalls (public)
router.get('/public/:id', getStallById)                 // GET /api/stalls/public/:id - Get stall details (public)

// ===== PUBLIC BLOB IMAGE ROUTES (No Auth - for <img> tags) =====
// These routes serve images directly without authentication so they can be loaded in img tags
// NOTE: More specific routes must come BEFORE generic routes to avoid path parameter collisions
router.get('/images/blob/id/:image_id', getStallImageBlobById)           // GET /api/stalls/images/blob/id/:image_id - Serve image by ID (MUST be before generic route)
router.get('/images/blob/primary/:stall_id', getStallPrimaryImageBlob)   // GET /api/stalls/images/blob/primary/:stall_id - Get primary image
router.get('/images/blob/:stall_id/:display_order', getStallImageBlob)   // GET /api/stalls/images/blob/:stall_id/:display_order - Serve image binary
router.get('/public/:stall_id/images/blob', getStallImagesBlob)          // GET /api/stalls/public/:stall_id/images/blob - Get images metadata (public)

// ===== PROTECTED ROUTES (Authentication Required) =====
router.use(authMiddleware.authenticateToken)
router.use(activityLogger)  // Log all protected stall operations

// Stall routes
router.post('/', 
  (req, res, next) => {
    console.log('🎯 POST /api/stalls received');
    console.log('  - User:', req.user);
    console.log('  - Content-Type:', req.headers['content-type']);
    console.log('  - Files:', req.files?.length || 0);
    next();
  },
  viewOnlyForOwners, 
  tempUpload.array('images', 10), 
  addStallWithImages
)  // POST /api/stalls - Add new stall with images
router.get('/', getAllStalls)                 // GET /api/stalls - Get all stalls for branch manager
router.get('/available', getAvailableStalls)  // GET /api/stalls/available - Get available stalls
router.get('/filter', getStallsByFilter)     // GET /api/stalls/filter - Get stalls by filter
router.get('/:id', getStallById)             // GET /api/stalls/:id - Get stall by ID
router.put('/:id', viewOnlyForOwners, updateStall)              // PUT /api/stalls/:id - Update stall
router.delete('/:id', viewOnlyForOwners, deleteStall)           // DELETE /api/stalls/:id - Delete stall

// ===== RAFFLE MANAGEMENT ROUTES =====
router.get('/raffles/active', getActiveRaffles)                    // GET /api/stalls/raffles/active - Get all active raffles
router.get('/raffles/stall/:stallId/participants', getRaffleParticipantsByStall)  // GET /api/stalls/raffles/stall/:stallId/participants - Get participants who joined raffle
router.get('/raffles/:raffleId', getRaffleDetails)                 // GET /api/stalls/raffles/:raffleId - Get raffle details
router.post('/raffles/:stallId/create', viewOnlyForOwners, createRaffle)              // POST /api/stalls/raffles/:stallId/create - Create raffle for stall
router.post('/raffles/:stallId/join', viewOnlyForOwners, joinRaffle)                  // POST /api/stalls/raffles/:stallId/join - Join raffle (triggers timer)
router.put('/raffles/:raffleId/extend', viewOnlyForOwners, extendRaffleTimer)         // PUT /api/stalls/raffles/:raffleId/extend - Extend raffle timer
router.put('/raffles/:raffleId/cancel', viewOnlyForOwners, cancelRaffle)              // PUT /api/stalls/raffles/:raffleId/cancel - Cancel raffle
router.post('/raffles/:raffleId/select-winner', viewOnlyForOwners, selectRaffleWinner) // POST /api/stalls/raffles/:raffleId/select-winner - Select winner
router.post('/raffles/auto-select-winners', viewOnlyForOwners, autoSelectWinnerForExpiredRaffles) // POST /api/stalls/raffles/auto-select-winners - Auto select winners

// ===== AUCTION MANAGEMENT ROUTES =====
router.get('/auctions/active', getActiveAuctions)                   // GET /api/stalls/auctions/active - Get all active auctions
router.get('/auctions/stall/:stallId/participants', getAuctionParticipantsByStall)  // GET /api/stalls/auctions/stall/:stallId/participants - Get participants who joined auction
router.get('/auctions/:auctionId', getAuctionDetails)               // GET /api/stalls/auctions/:auctionId - Get auction details
router.post('/auctions/:stallId/create', viewOnlyForOwners, createAuction)             // POST /api/stalls/auctions/:stallId/create - Create auction for stall
router.post('/auctions/:stallId/bid', viewOnlyForOwners, placeBid)                     // POST /api/stalls/auctions/:stallId/bid - Place bid (triggers timer)
router.put('/auctions/:auctionId/extend', viewOnlyForOwners, extendAuctionTimer)       // PUT /api/stalls/auctions/:auctionId/extend - Extend auction timer
router.put('/auctions/:auctionId/cancel', viewOnlyForOwners, cancelAuction)            // PUT /api/stalls/auctions/:auctionId/cancel - Cancel auction
router.post('/auctions/:auctionId/select-winner', viewOnlyForOwners, selectAuctionWinner) // POST /api/stalls/auctions/:auctionId/select-winner - Confirm winner
router.post('/auctions/auto-select-winners', viewOnlyForOwners, autoSelectWinnerForExpiredAuctions) // POST /api/stalls/auctions/auto-select-winners - Auto confirm winners

// ===== STALL IMAGE MANAGEMENT ROUTES =====
// Upload stall images (max 10 per stall, 2MB each, PNG/JPG only)
router.post('/:stall_id/images/upload', viewOnlyForOwners, upload.array('images', 10), uploadStallImages)  // POST /api/stalls/:stall_id/images/upload - Upload multiple images
router.get('/:stall_id/images', getStallImages)                     // GET /api/stalls/:stall_id/images - Get all images for stall
router.get('/:stall_id/images/count', getStallImageCount)           // GET /api/stalls/:stall_id/images/count - Get image count
router.delete('/images/:image_id', viewOnlyForOwners, deleteStallImage)                // DELETE /api/stalls/images/:image_id - Delete image by database ID
router.delete('/:stall_id/images/:filename', viewOnlyForOwners, deleteStallImageByFilename)  // DELETE /api/stalls/:stall_id/images/:filename - Delete image by filename
router.put('/images/:image_id/set-primary', viewOnlyForOwners, setStallPrimaryImage)   // PUT /api/stalls/images/:image_id/set-primary - Set primary image

// ===== BLOB IMAGE ROUTES (Cloud Storage) =====
// These routes store images directly in database as BLOB for cloud deployment
router.post('/images/blob/upload', viewOnlyForOwners, uploadStallImageBlob)            // POST /api/stalls/images/blob/upload - Upload single image as base64
router.post('/images/blob/upload-multiple', viewOnlyForOwners, uploadStallImagesBlob)  // POST /api/stalls/images/blob/upload-multiple - Upload multiple images as base64
// GET routes moved to PUBLIC section above (for img tag access without auth)
router.get('/:stall_id/images/blob', getStallImagesBlob)                               // GET /api/stalls/:stall_id/images/blob - Get all images metadata
router.put('/images/blob/:image_id', viewOnlyForOwners, updateStallImageBlob)          // PUT /api/stalls/images/blob/:image_id - Update image
router.delete('/images/blob/:image_id', viewOnlyForOwners, deleteStallImageBlob)       // DELETE /api/stalls/images/blob/:image_id - Delete image
router.delete('/:stall_id/legacy-image', viewOnlyForOwners, deleteLegacyStallImage)    // DELETE /api/stalls/:stall_id/legacy-image - Delete legacy image from stall table
router.put('/images/blob/:image_id/primary', viewOnlyForOwners, setStallPrimaryImageBlob) // PUT /api/stalls/images/blob/:image_id/primary - Set primary

export default router