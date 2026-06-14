// ===== ASSIGNED LOCATION - REPOSITORY (DATABASE LAYER) =====
// This is the ONLY place in the codebase that communicates with the database
// for assigned_location operations. All calls use stored procedures exclusively.
// No raw SQL queries are built or executed here — only CALL statements.

import { createConnection } from '../../../config/database.js';

/**
 * Check whether a location_name already exists (case-insensitive).
 * @param {string} locationName
 * @param {number|null} excludeId – pass the current ID during updates to skip self-match
 * @returns {Promise<boolean>}
 */
export async function locationExists(locationName, excludeId = null) {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'CALL sp_assigned_location_exists(?, ?)',
      [locationName, excludeId]
    );
    // result[0] is the first result set which contains [{ cnt: N }]
    const cnt = result[0]?.[0]?.cnt ?? 0;
    return cnt > 0;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Insert a new assigned location.
 * @param {string} locationName – already trimmed by the service layer
 * @returns {Promise<object>} – the freshly created row
 */
export async function createLocation(locationName) {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'CALL sp_assigned_location_create(?)',
      [locationName]
    );
    // The SP returns the created row as the first result set
    return result[0]?.[0] ?? null;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Get a paginated list of assigned locations with search and sort.
 * @param {object} params
 * @param {string|null} params.search
 * @param {string} params.sortBy – 'location_name' | 'created_at'
 * @param {string} params.sortDir – 'ASC' | 'DESC'
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: Array, total: number }>}
 */
export async function getAllLocations({ search, sortBy, sortDir, limit, offset }) {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'CALL sp_assigned_location_get_all(?, ?, ?, ?, ?)',
      [search || null, sortBy, sortDir, limit, offset]
    );
    // SP returns two result sets:
    //   result[0] = paginated rows
    //   result[1] = [{ total: N }]
    const rows = result[0] || [];
    const total = result[1]?.[0]?.total ?? 0;
    return { rows, total };
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Get a single assigned location by ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getLocationById(id) {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'CALL sp_assigned_location_get_by_id(?)',
      [id]
    );
    return result[0]?.[0] ?? null;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Update an existing assigned location's name.
 * @param {number} id
 * @param {string} locationName
 * @returns {Promise<object|null>} – the updated row
 */
export async function updateLocation(id, locationName) {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute(
      'CALL sp_assigned_location_update(?, ?)',
      [id, locationName]
    );
    return result[0]?.[0] ?? null;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Permanently delete an assigned location.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteLocation(id) {
  let connection;
  try {
    connection = await createConnection();
    await connection.execute(
      'CALL sp_assigned_location_delete(?)',
      [id]
    );
  } finally {
    if (connection) await connection.end();
  }
}
