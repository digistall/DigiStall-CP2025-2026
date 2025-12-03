import express from 'express'
import authMiddleware from '../middleware/auth.js'
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

const router = express.Router()

// ===== PUBLIC ROUTES (No Authentication) =====
// Landing page stall browsing
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

// Stall routes
router.post('/', viewOnlyForOwners, addStall)                    // POST /api/stalls - Add new stall
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

export default router