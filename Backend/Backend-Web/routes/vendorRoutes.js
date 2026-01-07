import express from "express";
import {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} from "../controllers/vendors/vendorController.js";

const router = express.Router();

/**
 * Vendor Management Routes
 * Routes for managing Vendor accounts
 * Note: Authentication is applied at the mount point in server.js
 */

/**
 * @route   POST /api/vendors
 * @desc    Create new vendor account
 * @access  Business Manager
 * @body    { firstName, lastName, middleName?, phone?, email?, birthdate?, gender?, address?, businessName?, businessType?, businessDescription?, vendorIdentifier?, collectorId? }
 */
router.post("/", createVendor);

/**
 * @route   GET /api/vendors
 * @desc    Get all vendors
 * @access  Business Manager
 * @query   branchId? - Filter by branch
 * @query   collectorId? - Filter by collector
 */
router.get("/", getAllVendors);

/**
 * @route   GET /api/vendors/:id
 * @desc    Get vendor by ID
 * @access  Business Manager
 * @params  id - Vendor ID
 */
router.get("/:id", getVendorById);

/**
 * @route   PUT /api/vendors/:id
 * @desc    Update vendor information
 * @access  Business Manager
 * @params  id - Vendor ID
 * @body    { firstName?, lastName?, middleName?, phone?, email?, birthdate?, gender?, address?, businessName?, businessType?, businessDescription?, vendorIdentifier?, collectorId?, status? }
 */
router.put("/:id", updateVendor);

/**
 * @route   DELETE /api/vendors/:id
 * @desc    Delete/deactivate a vendor
 * @access  Business Manager
 * @params  id - Vendor ID
 */
router.delete("/:id", deleteVendor);

export default router;
