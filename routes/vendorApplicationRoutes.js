import express from 'express'
import { submitVendorApplication } from '../BACKEND/PUBLIC/vendorApplicantController.js'

const router = express.Router()

router.post('/submit', submitVendorApplication)

export default router
