import express from 'express';
import {
  getStallsByType,
  getStallsByArea,
  getAllStalls,
  getStallById,
  searchStalls
} from '../SHARE-CONTROLLER/stall/stallController.js';

// Import stall image BLOB controller for serving images
import {
  getStallImageBlobById,
  getStallImagesBlob
} from '../SHARE-CONTROLLER/stalls/stallImageBlobController.js';

const router = express.Router();

/**
 * MOBILE STALL ROUTES
 * All routes for mobile app stall operations
 * Base path: /api/mobile/stalls
 */

// ===== PUBLIC ROUTES (No authentication) =====

/**
 * @route GET /api/mobile/stalls/type/:type
 * @desc Get stalls by type (Fixed Price, Raffle, Auction)
 * @query applicant_id - Required: Applicant ID
 */
router.get('/type/:type', getStallsByType);

/**
 * @route GET /api/mobile/stalls/area/:area
 * @desc Get stalls by area
 * @query applicant_id - Required: Applicant ID
 */
router.get('/area/:area', getStallsByArea);

/**
 * @route GET /api/mobile/stalls/search
 * @desc Search stalls
 * @query q - Search query
 */
router.get('/search', searchStalls);

/**
 * @route GET /api/mobile/stalls/images/blob/id/:image_id
 * @desc Get stall image by ID (serves binary image)
 */
router.get('/images/blob/id/:image_id', getStallImageBlobById);

/**
 * @route GET /api/mobile/stalls/:stall_id/images/blob
 * @desc Get all images for a stall
 */
router.get('/:stall_id/images/blob', getStallImagesBlob);

/**
 * @route GET /api/mobile/stalls/:id
 * @desc Get stall by ID
 * @query applicant_id - Optional: Applicant ID
 */
router.get('/:id', getStallById);

/**
 * @route GET /api/mobile/stalls
 * @desc Get all stalls
 * @query applicant_id - Optional: Applicant ID
 */
router.get('/', getAllStalls);

export default router;
