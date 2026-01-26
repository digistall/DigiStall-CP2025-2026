import express from 'express';
import enhancedAuthMiddleware from '../MIDDLEWARE/enhancedAuth.js';
import {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor
} from '../CONTROLLERS/vendors/vendorController.js';

const router = express.Router();

/**
 * Vendor Management Routes
 * All routes for vendor CRUD operations
 */

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

/**
 * @route   POST /api/vendors
 * @desc    Create a new vendor
 * @access  Protected
 */
router.post('/', enhancedAuthMiddleware.authenticateToken, createVendor);

/**
 * @route   GET /api/vendors
 * @desc    Get all vendors
 * @access  Protected
 */
router.get('/', enhancedAuthMiddleware.authenticateToken, getAllVendors);

/**
 * @route   GET /api/vendors/:id
 * @desc    Get vendor by ID
 * @access  Protected
 */
router.get('/:id', enhancedAuthMiddleware.authenticateToken, getVendorById);

/**
 * @route   PUT /api/vendors/:id
 * @desc    Update vendor by ID
 * @access  Protected
 */
router.put('/:id', enhancedAuthMiddleware.authenticateToken, updateVendor);

/**
 * @route   DELETE /api/vendors/:id
 * @desc    Delete vendor by ID
 * @access  Protected
 */
router.delete('/:id', enhancedAuthMiddleware.authenticateToken, deleteVendor);

export default router;
