import express from 'express';
import { preRegisterForAuction, checkAuctionRegistration, getAuctionParticipants } from '../controllers/auction/auctionController.js';

const router = express.Router();

// Pre-register for auction
router.post('/pre-register', preRegisterForAuction);

// Check if applicant is registered for auction
router.get('/check-registration/:auctionId/:applicantId', checkAuctionRegistration);

// Get all participants for an auction
router.get('/participants/:auctionId', getAuctionParticipants);

export default router;
