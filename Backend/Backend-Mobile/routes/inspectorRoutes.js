import express from 'express';
import {
  getStallholdersByInspectorBranch,
  getStallholderById,
  reportStallholder,
  getViolationTypes
} from '../controllers/inspector/inspectorController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/mobile/inspector/stallholders
 * @desc Get all stallholders in inspector's branch
 * @access Protected (Inspector only)
 */
router.get('/stallholders', verifyToken, getStallholdersByInspectorBranch);

/**
 * @route GET /api/mobile/inspector/stallholders/:id
 * @desc Get stallholder details by ID
 * @access Protected (Inspector only)
 */
router.get('/stallholders/:id', verifyToken, getStallholderById);

/**
 * @route GET /api/mobile/inspector/violations
 * @desc Get all violation types
 * @access Protected (Inspector only)
 */
router.get('/violations', verifyToken, getViolationTypes);

/**
 * @route POST /api/mobile/inspector/report
 * @desc Submit a violation report for a stallholder
 * @access Protected (Inspector only)
 */
router.post('/report', verifyToken, reportStallholder);

export default router;
