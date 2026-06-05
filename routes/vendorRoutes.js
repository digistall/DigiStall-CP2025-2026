import express from "express";
import enhancedAuthMiddleware from "../middleware/enhancedAuth.js";
import { requireRole } from "../middleware/rolePermissions.js";
import {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  getAssignedLocations,
} from "../BACKEND/MANAGER/vendors/vendorController.js";

import { validate } from '../middleware/validateRequest.js';
import { createVendorSchema, updateVendorSchema } from '../middleware/schemas/vendorSchemas.js';

const router = express.Router();

router.use(enhancedAuthMiddleware.authenticateToken);
router.use(requireRole(["system_administrator", "stall_business_owner", "business_manager", "business_employee"]));

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
router.post("/", validate(createVendorSchema), createVendor);

/**
 * @route   GET /api/vendors
 * @desc    Get all vendors
 * @access  Protected
 */
router.get("/", getAllVendors);

/**
 * @route   GET /api/vendors/locations
 * @desc    Get assigned locations for dropdown
 * @access  Protected
 */
router.get(
  "/locations",
  getAssignedLocations,
);

/**
 * @route   GET /api/vendors/:id
 * @desc    Get vendor by ID
 * @access  Protected
 */
router.get("/:id", getVendorById);

/**
 * @route   PUT /api/vendors/:id
 * @desc    Update vendor by ID
 * @access  Protected
 */
router.put("/:id", validate(updateVendorSchema), updateVendor);

/**
 * @route   DELETE /api/vendors/:id
 * @desc    Delete vendor by ID
 * @access  Protected
 */
router.delete("/:id", deleteVendor);

export default router;
