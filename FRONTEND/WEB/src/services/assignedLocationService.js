// ===== ASSIGNED LOCATION - FRONTEND SERVICE =====
// All interaction with the assigned_location API goes through this file.
// There is absolutely NO SQL on the client side; everything uses the
// server's RESTful endpoints which internally call stored procedures.

import apiClient from './apiClient';

const BASE_URL = '/assigned-locations';

/**
 * Create a new assigned location.
 * @param {string} locationName
 * @returns {Promise<object>} API response { success, message, data }
 */
export async function createAssignedLocation(locationName) {
  const response = await apiClient.post(BASE_URL, {
    location_name: locationName
  });
  return response.data;
}

/**
 * Retrieve paginated list of assigned locations.
 * @param {object} params
 * @param {string}  [params.search]   – search filter
 * @param {string}  [params.sortBy]   – 'location_name' | 'created_at'
 * @param {string}  [params.sortDir]  – 'ASC' | 'DESC'
 * @param {number}  [params.page]     – page number (1-based)
 * @param {number}  [params.pageSize] – rows per page
 * @returns {Promise<object>} API response { success, message, data, pagination }
 */
export async function getAllAssignedLocations(params = {}) {
  const response = await apiClient.get(BASE_URL, { params });
  return response.data;
}

/**
 * Get a single assigned location by ID.
 * @param {number} id
 * @returns {Promise<object>} API response { success, message, data }
 */
export async function getAssignedLocationById(id) {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
}

/**
 * Update an existing assigned location.
 * @param {number} id
 * @param {string} locationName
 * @returns {Promise<object>} API response { success, message, data }
 */
export async function updateAssignedLocation(id, locationName) {
  const response = await apiClient.put(`${BASE_URL}/${id}`, {
    location_name: locationName
  });
  return response.data;
}

/**
 * Permanently delete an assigned location.
 * @param {number} id
 * @returns {Promise<object>} API response { success, message, data }
 */
export async function deleteAssignedLocation(id) {
  const response = await apiClient.delete(`${BASE_URL}/${id}`);
  return response.data;
}

export default {
  createAssignedLocation,
  getAllAssignedLocations,
  getAssignedLocationById,
  updateAssignedLocation,
  deleteAssignedLocation
};
