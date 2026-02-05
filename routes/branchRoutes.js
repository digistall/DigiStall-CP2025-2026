import express from 'express'
import authMiddleware from '../middleware/auth.js'
import {
  createBranch,
  getAllBranches,
  deleteBranch,
  createBranchManager,
  assignManager,
  updateBranchManager,
  deleteBranchManager,
  getBranchManagerById,
  getAllBranchManagers,
  getBranchesByArea,
  getAreas,
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getFloorsWithSections,
  // Merged area functions
  getAreasByCity,
  getAreaById,
  getCities,
  getLocationsByCity
} from '../SHARE-CONTROLLER/branch/branchController.js'

const router = express.Router()

// Apply authentication middleware to all branch routes
// Allow admin, branch manager, and business_owner access
router.use(authMiddleware.authenticateToken)

// Branch routes (admin/business_owner for creation/deletion, all roles for reading)
router.post('/', authMiddleware.authorizeRole('admin', 'business_owner', 'stall_business_owner'), createBranch)    // POST /api/branches - Create new branch
router.get('/', getAllBranches)                     // GET /api/branches - Get all branches (admin + branch manager)
router.delete('/:id', authMiddleware.authorizeRole('admin', 'business_owner', 'stall_business_owner'), deleteBranch)   // DELETE /api/branches/:id - Delete branch
router.get('/areas', getAreas)                      // GET /api/branches/areas - Get all areas
router.get('/area/:area', getBranchesByArea)        // GET /api/branches/area/:area - Get branches by area

// Branch manager routes (admin and business_owner)
router.get('/managers', authMiddleware.authorizeRole('admin', 'stall_business_owner'), getAllBranchManagers)       // GET /api/branches/managers - Get all branch managers
router.post('/managers', authMiddleware.authorizeRole('admin', 'stall_business_owner'), createBranchManager)       // POST /api/branches/managers - Create branch manager
router.get('/managers/:managerId', authMiddleware.authorizeRole('admin', 'stall_business_owner'), getBranchManagerById)  // GET /api/branches/managers/:managerId - Get branch manager by ID
router.put('/managers/:managerId', authMiddleware.authorizeRole('admin', 'stall_business_owner'), updateBranchManager)   // PUT /api/branches/managers/:managerId - Update branch manager
router.delete('/managers/:managerId', authMiddleware.authorizeRole('admin', 'stall_business_owner'), deleteBranchManager) // DELETE /api/branches/managers/:managerId - Delete branch manager
router.post('/assign-manager', authMiddleware.authorizeRole('admin', 'stall_business_owner'), assignManager)
router.post('/branch-managers', authMiddleware.authorizeRole('admin', 'stall_business_owner'), assignManager)       // POST /api/branches/branch-managers - Assign manager to branch

// Floor routes
router.get('/floors', getFloors)                    // GET /api/branches/floors - Get floors for branch manager
router.post('/floors', createFloor)                 // POST /api/branches/floors - Create new floor
router.put('/floors/:floorId', updateFloor)         // PUT /api/branches/floors/:floorId - Update floor
router.delete('/floors/:floorId', deleteFloor)      // DELETE /api/branches/floors/:floorId - Delete floor

// Section routes  
router.get('/sections', getSections)                // GET /api/branches/sections - Get sections for branch manager
router.post('/sections', createSection)             // POST /api/branches/sections - Create new section
router.put('/sections/:sectionId', updateSection)   // PUT /api/branches/sections/:sectionId - Update section
router.delete('/sections/:sectionId', deleteSection) // DELETE /api/branches/sections/:sectionId - Delete section

// Floor-Section combined routes
router.get('/floors-with-sections', getFloorsWithSections)  // GET /api/branches/floors-with-sections - Get floors with nested sections

// ===== AREA MANAGEMENT ROUTES (Merged from areaRoutes) =====
router.get('/cities', getCities)                    // GET /api/branches/cities - Get unique cities
router.get('/city/:city', getAreasByCity)           // GET /api/branches/city/:city - Get areas by city
router.get('/locations/:city', getLocationsByCity)  // GET /api/branches/locations/:city - Get locations by city
router.get('/area/:id', getAreaById)                // GET /api/branches/area/:id - Get area by ID with stats

export default router
