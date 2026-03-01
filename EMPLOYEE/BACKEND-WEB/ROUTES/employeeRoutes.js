import express from 'express';
import authMiddleware from '../../../SHARED/MIDDLEWARE/auth.js';
import {
  getAllCollectors,
  getCollectorById,
  createCollector,
  updateCollector,
  deleteCollector,
  getCollectorsByBranch
} from '../CONTROLLERS/collector/mobileStaffController.js';

const router = express.Router();

/**
 * EMPLOYEE - Web Backend Routes
 * All routes for employee web operations
 */

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Collector management
router.get('/collectors', authMiddleware, getAllCollectors);
router.get('/collectors/:id', authMiddleware, getCollectorById);
router.post('/collectors', authMiddleware, createCollector);
router.put('/collectors/:id', authMiddleware, updateCollector);
router.delete('/collectors/:id', authMiddleware, deleteCollector);
router.get('/collectors/branch/:branchId', authMiddleware, getCollectorsByBranch);

export default router;
