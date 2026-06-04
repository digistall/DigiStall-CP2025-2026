import express from 'express'
import { submitVendorApplication } from '../BACKEND/PUBLIC/vendorApplicantController.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/submit', authLimiter, submitVendorApplication)

export default router
