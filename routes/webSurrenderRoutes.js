import express from 'express';
import multer from 'multer';
import { getPendingRequests, updateRequestStatus, getStallHistory, getStallHistoryByStallId, importHistoryFromExcel } from '../BACKEND/MANAGER/surrender/webSurrenderController.js';
import { viewOnlyForOwners } from '../middleware/rolePermissions.js';

const router = express.Router();
const upload = multer();

router.get('/requests', getPendingRequests);
router.put('/requests/:requestId', viewOnlyForOwners, updateRequestStatus);
router.get('/history', getStallHistory);
router.get('/history/:stallId', getStallHistoryByStallId);
router.post('/import-legacy', viewOnlyForOwners, upload.single('file'), importHistoryFromExcel);

export default router;
