// ===== STALL MANAGEMENT CONTROLLER =====
// Unified stall controller serving both Admin Management and Landing Page

// Import core stall components (Management)
import { addStall } from './stallComponents/addStall.js'
import { getAllStalls } from './stallComponents/getAllStalls.js'
import { getAvailableStalls } from './stallComponents/getAvailableStalls.js'
import { getStallById } from './stallComponents/getStallById.js'
import { getStallsByFilter } from './stallComponents/getStallsByFilter.js'
import { updateStall } from './stallComponents/updateStall.js'
import { deleteStall } from './stallComponents/deleteStall.js'
import { getLiveStallInfo, startLiveSession } from './stallComponents/getLiveStallInfo.js'

// Import landing page components (Public)
import { getBranches } from './stallComponents/landingPageComponents/getBranches/getBranches.js'
import { getAvailableAreas } from './stallComponents/landingPageComponents/getAvailableAreas/getAvailableAreas.js'
import { getAvailableMarkets } from './stallComponents/landingPageComponents/getAvailableMarkets/getAvailableMarkets.js'
import { getLocationsByArea } from './stallComponents/landingPageComponents/getLocationsByArea/getLocationsByArea.js'
import { getStallsByArea } from './stallComponents/landingPageComponents/getStallsByArea/getStallsByArea.js'
import { getStallsByLocation } from './stallComponents/landingPageComponents/getStallsByLocation/getStallsByLocation.js'
import { getFilteredStalls } from './stallComponents/landingPageComponents/getFilteredStalls/getFilteredStalls.js'
import { getLandingPageStats } from './stallComponents/landingPageComponents/getLandingPageStats/getLandingPageStats.js'
import { getLandingPageStallholders } from './stallComponents/landingPageComponents/getLandingPageStallholders/getLandingPageStallholders.js'
import { getLandingPageStallsList } from './stallComponents/landingPageComponents/getLandingPageStallsList/getLandingPageStallsList.js'
import { getLandingPageFilterOptions } from './stallComponents/landingPageComponents/getLandingPageFilterOptions/getLandingPageFilterOptions.js'

// Import raffle components
import { createRaffle } from './stallComponents/raffleComponents/createRaffle.js'
import { joinRaffle } from './stallComponents/raffleComponents/joinRaffle.js'
import { getActiveRaffles, getRaffleDetails } from './stallComponents/raffleComponents/getRaffles.js'
import { extendRaffleTimer, cancelRaffle } from './stallComponents/raffleComponents/manageRaffle.js'
import { selectRaffleWinner, autoSelectWinnerForExpiredRaffles } from './stallComponents/raffleComponents/selectWinner.js'

// Import auction components
import { createAuction } from './stallComponents/auctionComponents/createAuction.js'
import { placeBid } from './stallComponents/auctionComponents/placeBid.js'
import { getActiveAuctions, getAuctionDetails } from './stallComponents/auctionComponents/getAuctions.js'
import { extendAuctionTimer, cancelAuction } from './stallComponents/auctionComponents/manageAuction.js'
import { selectAuctionWinner, autoSelectWinnerForExpiredAuctions } from './stallComponents/auctionComponents/selectWinner.js'

// Export all stall functions (components are called directly)
export {
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
}