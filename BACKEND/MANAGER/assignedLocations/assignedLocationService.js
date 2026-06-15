// ===== ASSIGNED LOCATION - SERVICE LAYER =====
// Business logic + input sanitization sit here, isolating the controller
// and repository from each other. The service never builds SQL — it
// delegates all persistence to the repository layer.

import * as repo from './assignedLocationRepository.js';

/**
 * Create a new assigned location.
 * Validates uniqueness (case-insensitive) before persisting.
 */
export async function createLocation(locationName) {
  const trimmed = (locationName || '').trim();

  // Validation
  if (!trimmed) {
    return { success: false, status: 400, message: 'Location name is required.' };
  }
  if (trimmed.length > 100) {
    return { success: false, status: 400, message: 'Location name must not exceed 100 characters.' };
  }

  // Check duplicates (case-insensitive)
  const exists = await repo.locationExists(trimmed, null);
  if (exists) {
    return { success: false, status: 409, message: 'Location name already exists.' };
  }

  const created = await repo.createLocation(trimmed);
  return {
    success: true,
    status: 201,
    message: 'Assigned location created successfully.',
    data: created
  };
}

/**
 * Retrieve a paginated, searchable, sortable list of assigned locations.
 */
export async function getAllLocations({ search, sortBy, sortDir, page, pageSize }) {
  // Normalise & clamp pagination values
  const safePage     = Math.max(1, parseInt(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
  const offset       = (safePage - 1) * safePageSize;

  // Whitelist sort options (defence in depth; SP also whitelists internally)
  const allowedSortBy  = ['location_name', 'created_at'];
  const allowedSortDir = ['ASC', 'DESC'];

  const safeSortBy  = allowedSortBy.includes(sortBy)  ? sortBy  : 'created_at';
  const safeSortDir = allowedSortDir.includes((sortDir || '').toUpperCase()) ? sortDir.toUpperCase() : 'DESC';

  const { rows, total } = await repo.getAllLocations({
    search: search || null,
    sortBy: safeSortBy,
    sortDir: safeSortDir,
    limit: safePageSize,
    offset
  });

  return {
    success: true,
    status: 200,
    message: 'Assigned locations retrieved successfully.',
    data: rows,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize)
    }
  };
}

/**
 * Get a single assigned location by its ID.
 */
export async function getLocationById(id) {
  const numericId = parseInt(id);
  if (!numericId || numericId < 1) {
    return { success: false, status: 400, message: 'A valid location ID is required.' };
  }

  const location = await repo.getLocationById(numericId);
  if (!location) {
    return { success: false, status: 404, message: 'Assigned location not found.' };
  }

  return {
    success: true,
    status: 200,
    message: 'Assigned location retrieved successfully.',
    data: location
  };
}

/**
 * Update an existing assigned location.
 * Validates existence and uniqueness (excluding self).
 */
export async function updateLocation(id, locationName) {
  const numericId = parseInt(id);
  if (!numericId || numericId < 1) {
    return { success: false, status: 400, message: 'A valid location ID is required.' };
  }

  const trimmed = (locationName || '').trim();
  if (!trimmed) {
    return { success: false, status: 400, message: 'Location name is required.' };
  }
  if (trimmed.length > 100) {
    return { success: false, status: 400, message: 'Location name must not exceed 100 characters.' };
  }

  // Duplicate check (excluding current record)
  const exists = await repo.locationExists(trimmed, numericId);
  if (exists) {
    return { success: false, status: 409, message: 'Location name already exists.' };
  }

  const updated = await repo.updateLocation(numericId, trimmed);
  if (!updated) {
    return { success: false, status: 404, message: 'Assigned location not found.' };
  }

  return {
    success: true,
    status: 200,
    message: 'Assigned location updated successfully.',
    data: updated
  };
}

/**
 * Permanently delete an assigned location.
 */
export async function deleteLocation(id) {
  const numericId = parseInt(id);
  if (!numericId || numericId < 1) {
    return { success: false, status: 400, message: 'A valid location ID is required.' };
  }

  // Verify existence first (the SP also validates, but we catch it here
  // for a clean 404 without depending on error parsing)
  const location = await repo.getLocationById(numericId);
  if (!location) {
    return { success: false, status: 404, message: 'Assigned location not found.' };
  }

  await repo.deleteLocation(numericId);

  return {
    success: true,
    status: 200,
    message: 'Assigned location deleted successfully.',
    data: { assigned_location_id: numericId }
  };
}
