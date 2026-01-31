/**
 * Stallholders Management Routes
 * Routes for admin/manager to manage stallholders
 * 
 * @route /api/stallholders-management
 */

import express from 'express';
import StallholderController from '../SHARE-CONTROLLER/stallholders/stallholderController.js';
import authMiddleware from '../MIDDLEWARE/auth.js';
import { viewOnlyForOwners } from '../MIDDLEWARE/rolePermissions.js';

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

export default router;
