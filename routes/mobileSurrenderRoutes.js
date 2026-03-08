import express from 'express';
import { checkEligibility, submitSurrenderRequest, getSurrenderStatus, submitExitSurvey } from '../BACKEND/STALLHOLDER/surrender/mobileSurrenderController.js';

const router = express.Router();

router.get('/eligibility/:stallId', checkEligibility);
router.post('/request', submitSurrenderRequest);
router.get('/status/:stallId', getSurrenderStatus);
router.post('/exit-survey', submitExitSurvey);

export default router;
