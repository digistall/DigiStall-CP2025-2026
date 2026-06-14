// ===== ASSIGNED LOCATION - CONTROLLER LAYER =====
// Handles HTTP concerns only: parse request → call service → send response.
// No SQL, no business logic, no direct DB access.

import * as service from './assignedLocationService.js';

/**
 * POST /api/assigned-locations
 * Create a new assigned location.
 */
export async function createAssignedLocation(req, res) {
  try {
    const { location_name } = req.body;
    const result = await service.createLocation(location_name);
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data })
    });
  } catch (error) {
    console.error('Error creating assigned location:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while creating the assigned location.'
    });
  }
}

/**
 * GET /api/assigned-locations
 * Retrieve paginated list with optional search and sort.
 *
 * Query params: search, sortBy, sortDir, page, pageSize
 */
export async function getAllAssignedLocations(req, res) {
  try {
    const { search, sortBy, sortDir, page, pageSize } = req.query;
    const result = await service.getAllLocations({ search, sortBy, sortDir, page, pageSize });
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching assigned locations:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while fetching assigned locations.'
    });
  }
}

/**
 * GET /api/assigned-locations/:id
 * Retrieve a single assigned location by ID.
 */
export async function getAssignedLocationById(req, res) {
  try {
    const { id } = req.params;
    const result = await service.getLocationById(id);
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data })
    });
  } catch (error) {
    console.error('Error fetching assigned location:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while fetching the assigned location.'
    });
  }
}

/**
 * PUT /api/assigned-locations/:id
 * Update an existing assigned location.
 */
export async function updateAssignedLocation(req, res) {
  try {
    const { id } = req.params;
    const { location_name } = req.body;
    const result = await service.updateLocation(id, location_name);
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data })
    });
  } catch (error) {
    console.error('Error updating assigned location:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while updating the assigned location.'
    });
  }
}

/**
 * DELETE /api/assigned-locations/:id
 * Permanently delete an assigned location.
 */
export async function deleteAssignedLocation(req, res) {
  try {
    const { id } = req.params;
    const result = await service.deleteLocation(id);
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data })
    });
  } catch (error) {
    console.error('Error deleting assigned location:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while deleting the assigned location.'
    });
  }
}
