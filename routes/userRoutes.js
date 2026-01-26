import express from 'express'
import { getUserProfile, updateUserProfile } from '../controllers/user/userController.js'

const router = express.Router()

// User profile routes (simplified for mobile)
router.get('/profile', getUserProfile)
router.put('/profile', updateUserProfile)

export default router