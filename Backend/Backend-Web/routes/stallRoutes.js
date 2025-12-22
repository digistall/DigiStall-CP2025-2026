import express from 'express'
import authMiddleware from '../middleware/auth.js'
import activityLogger from '../middleware/activityLogger.js'
import { viewOnlyForOwners } from '../middleware/rolePermissions.js'
import {
  // Core stall management (Admin)
  addStall,
  getAllStalls,
  getAvailableStalls,
  getStallById,
  getStallsByFilter,
  updateStall,
  deleteStall,
  getLiveStallInfo,
  startLiveSession,
  
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
  extendRaffleTimer,
  cancelRaffle,
  selectRaffleWinner,
  autoSelectWinnerForExpiredRaffles,
  
  // Auction management
  createAuction,
  placeBid,
  getActiveAuctions,
  getAuctionDetails,
  extendAuctionTimer,
  cancelAuction,
  selectAuctionWinner,
  autoSelectWinnerForExpiredAuctions
} from '../controllers/stalls/stallController.js'

// Import stall image controller
import {
  uploadStallImages,
  getStallImages,
  deleteStallImage,
  deleteStallImageByFilename,
  setStallPrimaryImage,
  getStallImageCount
} from '../controllers/stalls/stallImageController.js'

// Import new addStall with images
import { addStallWithImages } from '../controllers/stalls/stallComponents/addStallWithImages.js'

// Import multer configuration
import upload, { checkImageLimit } from '../config/multerStallImages.js'
import multer from 'multer'

// Temporary upload for addStall
const tempUpload = multer({ dest: 'uploads/temp/' })

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

// ===== LIVE SYSTEM ROUTES =====
router.get('/:stallId/live-info', getLiveStallInfo)    // GET /api/stalls/:stallId/live-info - Get live stall info (chat vs bidding)
router.post('/:stallId/go-live', viewOnlyForOwners, startLiveSession)     // POST /api/stalls/:stallId/go-live - Start live session (activates chat/bidding)

// ===== RAFFLE MANAGEMENT ROUTES =====
router.get('/raffles/active', getActiveRaffles)                    // GET /api/stalls/raffles/active - Get all active raffles
router.get('/raffles/:raffleId', getRaffleDetails)                 // GET /api/stalls/raffles/:raffleId - Get raffle details
router.post('/raffles/:stallId/create', viewOnlyForOwners, createRaffle)              // POST /api/stalls/raffles/:stallId/create - Create raffle for stall
router.post('/raffles/:stallId/join', viewOnlyForOwners, joinRaffle)                  // POST /api/stalls/raffles/:stallId/join - Join raffle (triggers timer)
router.put('/raffles/:raffleId/extend', viewOnlyForOwners, extendRaffleTimer)         // PUT /api/stalls/raffles/:raffleId/extend - Extend raffle timer
router.put('/raffles/:raffleId/cancel', viewOnlyForOwners, cancelRaffle)              // PUT /api/stalls/raffles/:raffleId/cancel - Cancel raffle
router.post('/raffles/:raffleId/select-winner', viewOnlyForOwners, selectRaffleWinner) // POST /api/stalls/raffles/:raffleId/select-winner - Select winner
router.post('/raffles/auto-select-winners', viewOnlyForOwners, autoSelectWinnerForExpiredRaffles) // POST /api/stalls/raffles/auto-select-winners - Auto select winners

// ===== AUCTION MANAGEMENT ROUTES =====
router.get('/auctions/active', getActiveAuctions)                   // GET /api/stalls/auctions/active - Get all active auctions
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

export default router