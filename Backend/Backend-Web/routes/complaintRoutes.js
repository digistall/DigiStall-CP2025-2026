// ===== COMPLAINT ROUTES =====
// Routes for complaint management
// All routes require authentication

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { authorizePermission } from '../middleware/enhancedAuth.js';
import { viewOnlyForOwners } from '../middleware/rolePermissions.js';
import complaintController from '../controllers/complaints/complaintController.js';

const router = express.Router();

/**
 * All routes require authentication
 * Some routes have additional role checks for write operations
 */

// ===== COMPLAINT ROUTES =====

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints with optional filters (status, search, branch)
 * @access  Protected - Requires authentication
 * @query   status (optional) - Filter by status: pending, in-progress, resolved, rejected, all
 * @query   search (optional) - Search by complaint ID, type, sender name, stallholder name, or subject
 * @query   branch_id (optional) - Filter by branch (automatically applied based on user role)
 */
router.get('/', complaintController.getAllComplaints);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get single complaint by ID
 * @access  Protected - Requires authentication
 */
router.get('/:id', complaintController.getComplaintById);

/**
 * @route   POST /api/complaints
 * @desc    Create new complaint
 * @access  Protected - Requires authentication
 * @body    {
 *            complaint_type: string (required) - e.g., "Sanitary Issue", "Illegal Vending", "Faulty Equipment"
 *            sender_name: string (required) - Name of person submitting complaint
 *            sender_contact: string (optional) - Contact number of sender
 *            sender_email: string (optional) - Email of sender
 *            stallholder_id: number (optional) - Stallholder being complained about
 *            stall_id: number (optional) - Stall related to complaint
 *            branch_id: number (required if user has no branch) - Branch where complaint occurred
 *            subject: string (required) - Brief subject/title of complaint
 *            description: string (required) - Detailed description of complaint
 *            evidence: string (optional) - Evidence/attachments (file paths or URLs)
 *            priority: enum ['low', 'medium', 'high', 'urgent'] (default: 'medium')
 *          }
 */
router.post('/', complaintController.createComplaint);

/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint (type, subject, description, priority, status)
 * @access  Protected - Requires authentication, restricted for owners (view-only mode)
 * @body    {
 *            complaint_type: string (optional)
 *            subject: string (optional)
 *            description: string (optional)
 *            priority: enum ['low', 'medium', 'high', 'urgent'] (optional)
 *            status: enum ['pending', 'in-progress', 'resolved', 'rejected'] (optional)
 *          }
 */
router.put('/:id', viewOnlyForOwners, complaintController.updateComplaint);

/**
 * @route   PUT /api/complaints/:id/resolve
 * @desc    Resolve or reject complaint with resolution notes
 * @access  Protected - Requires authentication, restricted for owners (view-only mode)
 * @body    {
 *            resolution_notes: string (required) - Notes about resolution or action taken
 *            status: enum ['resolved', 'rejected'] (default: 'resolved')
 *          }
 */
router.put('/:id/resolve', viewOnlyForOwners, complaintController.resolveComplaint);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete complaint
 * @access  Protected - Admin, Business Owner, and Branch Manager only
 */
router.delete('/:id', viewOnlyForOwners, complaintController.deleteComplaint);

export default router;
