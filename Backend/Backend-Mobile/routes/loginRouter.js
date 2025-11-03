import express from 'express'
import { mobileLogin, submitApplication } from '../controllers/login/loginController.js'

const router = express.Router()

// Mobile login route - POST /login (matches mobile app expectation)
router.post('/login', mobileLogin)

// Mobile application submission route - POST /submit-application (legacy endpoint)
router.post('/submit-application', submitApplication)

export default router