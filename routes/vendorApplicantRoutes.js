import express from 'express'
import enhancedAuthMiddleware from '../middleware/enhancedAuth.js'
import { requireRole } from '../middleware/rolePermissions.js'
import {
  getVendorApplicants,
  getVendorApplicantById,
  approveVendorApplicant,
  updateVendorApplicantStatus,
} from '../BACKEND/MANAGER/vendorApplicants/vendorApplicantController.js'

const router = express.Router()

router.use(enhancedAuthMiddleware.authenticateToken)
router.use(requireRole(['system_administrator', 'stall_business_owner', 'business_manager', 'business_employee']))

router.get('/', getVendorApplicants)
router.get('/:id', getVendorApplicantById)
router.put('/:id/approve', approveVendorApplicant)
router.put('/:id/status', updateVendorApplicantStatus)

export default router
