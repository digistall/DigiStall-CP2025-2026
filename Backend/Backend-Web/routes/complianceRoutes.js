// ===== COMPLIANCE ROUTES =====
// Routes for compliance/violation record management
// All routes require authentication and compliance permission

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { authorizePermission } from '../middleware/enhancedAuth.js';
import { viewOnlyForOwners } from '../middleware/rolePermissions.js';
import complianceController from '../controllers/compliances/complianceController.js';

const router = express.Router();

/**
 * All routes require authentication
 * Most routes also require 'compliances' permission (checked by route guard in main router)
 * Some routes have additional role checks
 */

// ===== COMPLIANCE RECORDS ROUTES =====

/**
 * @route   GET /api/compliances/statistics
 * @desc    Get compliance statistics (pending, complete, etc.)
 * @access  Protected - Requires authentication and compliance permission
 */
router.get('/statistics', complianceController.getComplianceStatistics);

/**
 * @route   GET /api/compliances
 * @desc    Get all compliance records with optional filters (status, search, branch)
 * @access  Protected - Requires authentication and compliance permission
 * @query   status (optional) - Filter by status: pending, in-progress, complete, incomplete, all
 * @query   search (optional) - Search by ID, type, inspector, or stallholder name
 * @query   branch_id (optional) - Filter by branch (admin only)
 */
router.get('/', complianceController.getAllComplianceRecords);

/**
 * @route   GET /api/compliances/:id/evidence/image
 * @desc    Serve evidence image as binary (can be used directly as img src)
 * @access  Protected - Requires authentication and compliance permission
 */
router.get('/:id/evidence/image', complianceController.getComplianceEvidenceImage);

/**
 * @route   GET /api/compliances/:id
 * @desc    Get single compliance record by ID
 * @access  Protected - Requires authentication and compliance permission
 */
router.get('/:id', complianceController.getComplianceRecordById);

/**
 * @route   POST /api/compliances
 * @desc    Create new compliance/violation record
 * @access  Protected - Requires authentication and compliance permission
 * @body    {
 *            inspector_id: number (optional),
 *            stallholder_id: number (required),
 *            violation_id: number (optional),
 *            stall_id: number (optional),
 *            compliance_type: string (required if no violation_id),
 *            severity: enum ['minor', 'moderate', 'major', 'critical'],
 *            remarks: string (optional),
 *            offense_no: number (default: 1),
 *            penalty_id: number (optional)
 *          }
 */
router.post('/', viewOnlyForOwners, complianceController.createComplianceRecord);

/**
 * @route   PUT /api/compliances/:id
 * @desc    Update compliance record (status, remarks)
 * @access  Protected - Requires authentication and compliance permission
 * @body    {
 *            status: enum ['pending', 'in-progress', 'complete', 'incomplete'],
 *            remarks: string (optional)
 *          }
 */
router.put('/:id', viewOnlyForOwners, complianceController.updateComplianceRecord);

/**
 * @route   DELETE /api/compliances/:id
 * @desc    Delete compliance record
 * @access  Protected - Admin and Branch Manager only
 */
router.delete('/:id', viewOnlyForOwners, complianceController.deleteComplianceRecord);

// ===== HELPER/LOOKUP ROUTES =====

/**
 * @route   GET /api/compliances/inspectors
 * @desc    Get all active inspectors
 * @access  Protected - Requires authentication and compliance permission
 */
router.get('/helpers/inspectors', complianceController.getAllInspectors);

/**
 * @route   GET /api/compliances/violations
 * @desc    Get all violation types
 * @access  Protected - Requires authentication and compliance permission
 */
router.get('/helpers/violations', complianceController.getAllViolations);

/**
 * @route   GET /api/compliances/violations/:violationId/penalties
 * @desc    Get penalties for a specific violation
 * @access  Protected - Requires authentication and compliance permission
 */
router.get('/helpers/violations/:violationId/penalties', complianceController.getViolationPenalties);

export default router;
