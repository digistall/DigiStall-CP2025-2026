/**
 * Stallholders Management Routes
 * Routes for admin/manager to manage stallholders
 * 
 * @route /api/stallholders
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import StallholderController from '../BACKEND/MANAGER/stallholders/stallholderController.js';

const upload = multer({ dest: 'uploads/temp/' });
import {
  getAllDocumentTypes,
  getBranchDocumentRequirements,
  createBranchDocumentRequirement,
  setBranchDocumentRequirement,
  removeBranchDocumentRequirement
} from '../BACKEND/MANAGER/stallholders/documentController.js';
import authMiddleware from '../middleware/auth.js';
import { viewOnlyForOwners, checkBranchAccess } from '../middleware/rolePermissions.js';

import { validate } from '../middleware/validateRequest.js';
import {
  createStallholderSchema, updateStallholderSchema, importStallholdersSchema
} from '../middleware/schemas/stallholderSchemas.js';
import {
  createDocumentRequirementSchema, updateDocumentRequirementSchema
} from '../middleware/schemas/documentSchemas.js';

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
 * @route GET /api/stallholders-management/excel/template
 * @desc Download Excel template
 * @access Protected
 */
router.get('/excel/template', StallholderController.downloadExcelTemplate);

/**
 * @route GET /api/stallholders-management/available-stalls
 * @desc Get available stalls for assignment
 * @access Protected
 */
router.get('/available-stalls', StallholderController.getAvailableStalls);

/**
 * @route GET /api/stallholders-management/:id
 * @desc Get stallholder by ID
 * @access Protected
 */
router.get('/:id', checkBranchAccess('stallholder', 'stallholder_id'), StallholderController.getStallholderById);

/**
 * @route GET /api/stallholders-management/:id/violations
 * @desc Get violation history for a specific stallholder
 * @access Protected
 */
router.get('/:id/violations', checkBranchAccess('stallholder', 'stallholder_id'), StallholderController.getViolationHistory);

/**
 * @route POST /api/stallholders-management
 * @desc Create a new stallholder
 * @access Protected (Admin, Manager)
 */
router.post('/', viewOnlyForOwners, validate(createStallholderSchema), StallholderController.createStallholder);

/**
 * @route PUT /api/stallholders-management/:id
 * @desc Update a stallholder
 * @access Protected (Admin, Manager)
 */
router.put('/:id', viewOnlyForOwners, checkBranchAccess('stallholder', 'stallholder_id'), validate(updateStallholderSchema), StallholderController.updateStallholder);

/**
 * @route DELETE /api/stallholders-management/:id
 * @desc Delete a stallholder
 * @access Protected (Admin, Manager)
 */
router.delete('/:id', viewOnlyForOwners, checkBranchAccess('stallholder', 'stallholder_id'), StallholderController.deleteStallholder);

/**
 * @route POST /api/stallholders-management/excel/import-direct
 * @desc Import stallholders from Excel
 * @access Protected (Admin, Manager)
 */
router.post('/excel/import-direct', viewOnlyForOwners, upload.single('file'), StallholderController.importFromExcel);

/**
 * @route POST /api/stallholders-management/excel/preview
 * @desc Preview Excel data before import
 * @access Protected (Admin, Manager)
 */
router.post('/excel/preview', viewOnlyForOwners, upload.single('file'), StallholderController.previewExcelData);

/**
 * @route POST /api/stallholders-management/excel/import
 * @desc Import Excel data (after preview)
 * @access Protected (Admin, Manager)
 */
router.post('/excel/import', viewOnlyForOwners, validate(importStallholdersSchema), StallholderController.importExcelData);

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
router.post('/documents/requirements', viewOnlyForOwners, validate(createDocumentRequirementSchema), createBranchDocumentRequirement);

/**
 * @route PUT /api/stallholders/documents/requirements/:documentTypeId
 * @desc Update a document requirement (is_required, instructions)
 * @access Protected (Owner, Manager)
 */
router.put('/documents/requirements/:documentTypeId', viewOnlyForOwners, validate(updateDocumentRequirementSchema), setBranchDocumentRequirement);

/**
 * @route DELETE /api/stallholders/documents/requirements/:documentTypeId
 * @desc Remove a document requirement from a branch
 * @access Protected (Owner, Manager)
 */
router.delete('/documents/requirements/:documentTypeId', viewOnlyForOwners, removeBranchDocumentRequirement);

export default router;