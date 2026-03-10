/**
 * Stallholders Management Routes
 * Routes for admin/manager to manage stallholders
 * 
 * @route /api/stallholders
 */

import express from 'express';
import StallholderController from '../BACKEND/MANAGER/stallholders/stallholderController.js';
import {
  getAllDocumentTypes,
  getBranchDocumentRequirements,
  createBranchDocumentRequirement,
  setBranchDocumentRequirement,
  removeBranchDocumentRequirement
} from '../BACKEND/MANAGER/stallholders/documentController.js';
import authMiddleware from '../middleware/auth.js';
import { viewOnlyForOwners } from '../middleware/rolePermissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware.authenticateToken);

/**
 * @route GET /api/stallholders-management
 * @desc Get all stallholders for management
 * @access Protected (Admin, Manager, Owner)
 */
router.get('/', StallholderController.getAllStallholders);

/**
 * @route GET /api/stallholders-management/:id
 * @desc Get stallholder by ID
 * @access Protected
 */
router.get('/:id', StallholderController.getStallholderById);

/**
 * @route GET /api/stallholders-management/:id/violations
 * @desc Get violation history for a specific stallholder
 * @access Protected
 */
router.get('/:id/violations', StallholderController.getViolationHistory);

/**
 * @route POST /api/stallholders-management
 * @desc Create a new stallholder
 * @access Protected (Admin, Manager)
 */
router.post('/', viewOnlyForOwners, StallholderController.createStallholder);

/**
 * @route PUT /api/stallholders-management/:id
 * @desc Update a stallholder
 * @access Protected (Admin, Manager)
 */
router.put('/:id', viewOnlyForOwners, StallholderController.updateStallholder);

/**
 * @route DELETE /api/stallholders-management/:id
 * @desc Delete a stallholder
 * @access Protected (Admin, Manager)
 */
router.delete('/:id', viewOnlyForOwners, StallholderController.deleteStallholder);

/**
 * @route POST /api/stallholders-management/import
 * @desc Import stallholders from Excel
 * @access Protected (Admin, Manager)
 */
router.post('/import', viewOnlyForOwners, StallholderController.importFromExcel);

/**
 * @route GET /api/stallholders-management/template
 * @desc Download Excel template
 * @access Protected
 */
router.get('/template', StallholderController.downloadExcelTemplate);

/**
 * @route POST /api/stallholders-management/preview
 * @desc Preview Excel data before import
 * @access Protected (Admin, Manager)
 */
router.post('/preview', viewOnlyForOwners, StallholderController.previewExcelData);

/**
 * @route POST /api/stallholders-management/import-data
 * @desc Import Excel data (after preview)
 * @access Protected (Admin, Manager)
 */
router.post('/import-data', viewOnlyForOwners, StallholderController.importExcelData);

/**
 * @route GET /api/stallholders-management/available-stalls
 * @desc Get available stalls for assignment
 * @access Protected
 */
router.get('/available-stalls', StallholderController.getAvailableStalls);

// ============================================================
// DOCUMENT REQUIREMENT ROUTES
// ============================================================

/**
 * @route GET /api/stallholders/documents/types
 * @desc Get all available document types
 * @access Protected (Owner, Manager)
 */
router.get('/documents/types', getAllDocumentTypes);

/**
 * @route GET /api/stallholders/documents/requirements
 * @desc Get branch document requirements (branch resolved from token)
 * @access Protected (Owner, Manager)
 */
router.get('/documents/requirements', getBranchDocumentRequirements);

/**
 * @route POST /api/stallholders/documents/requirements
 * @desc Create a new document requirement for a branch
 * @access Protected (Owner, Manager)
 */
router.post('/documents/requirements', viewOnlyForOwners, createBranchDocumentRequirement);

/**
 * @route PUT /api/stallholders/documents/requirements/:documentTypeId
 * @desc Update a document requirement (is_required, instructions)
 * @access Protected (Owner, Manager)
 */
router.put('/documents/requirements/:documentTypeId', viewOnlyForOwners, setBranchDocumentRequirement);

/**
 * @route DELETE /api/stallholders/documents/requirements/:documentTypeId
 * @desc Remove a document requirement from a branch
 * @access Protected (Owner, Manager)
 */
router.delete('/documents/requirements/:documentTypeId', viewOnlyForOwners, removeBranchDocumentRequirement);

export default router;
