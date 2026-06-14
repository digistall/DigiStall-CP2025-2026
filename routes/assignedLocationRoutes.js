// ===== ASSIGNED LOCATION ROUTES =====
// RESTful endpoints for assigned_location CRUD.
// All database work is delegated through Controller → Service → Repository → Stored Procedures.
// There is absolutely NO SQL on the client side.

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validateRequest.js';
import {
  createAssignedLocationSchema,
  updateAssignedLocationSchema,
  getAssignedLocationsQuerySchema
} from '../middleware/schemas/assignedLocationSchemas.js';
import {
  createAssignedLocation,
  getAllAssignedLocations,
  getAssignedLocationById,
  updateAssignedLocation,
  deleteAssignedLocation
} from '../BACKEND/MANAGER/assignedLocations/assignedLocationController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.authenticateToken);

// POST   /api/assigned-locations       – Create a new location
router.post(
  '/',
  validate(createAssignedLocationSchema),
  createAssignedLocation
);

// GET    /api/assigned-locations       – Get paginated list (search, sort, pagination)
router.get(
  '/',
  validateQuery(getAssignedLocationsQuerySchema),
  getAllAssignedLocations
);

// GET    /api/assigned-locations/:id   – Get a single location by ID
router.get('/:id', getAssignedLocationById);

// PUT    /api/assigned-locations/:id   – Update an existing location
router.put(
  '/:id',
  validate(updateAssignedLocationSchema),
  updateAssignedLocation
);

// DELETE /api/assigned-locations/:id   – Permanently delete a location
router.delete('/:id', deleteAssignedLocation);

export default router;
