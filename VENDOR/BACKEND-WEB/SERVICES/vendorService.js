/**
 * VENDOR - Vendor Service
 * Business logic for vendor operations
 */

import { createConnection } from '../../../config/database.js';

/**
 * Get all vendors with stats
 * @param {Object} filters - Filter options
 * @returns {Array} List of vendors
 */
export const getAllVendors = async (filters = {}) => {
  let connection;
  try {
    connection = await createConnection();
    
    let query = `
      SELECT v.*,
        (SELECT COUNT(*) FROM stalls WHERE vendor_id = v.vendor_id) as total_stalls
      FROM vendors v
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.status) {
      query += ' AND v.status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY v.created_at DESC';
    
    const [vendors] = await connection.execute(query, params);
    return vendors;
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get vendor by ID with details
 * @param {number} vendorId - Vendor ID
 * @returns {Object|null} Vendor data with details
 */
export const getVendorWithDetails = async (vendorId) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [[vendor]] = await connection.execute(
      'SELECT * FROM vendors WHERE vendor_id = ?',
      [vendorId]
    );
    
    if (!vendor) return null;
    
    // Get vendor's stalls
    const [stalls] = await connection.execute(
      'SELECT * FROM stalls WHERE vendor_id = ?',
      [vendorId]
    );
    
    return {
      ...vendor,
      stalls
    };
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Create vendor with validation
 * @param {Object} vendorData - Vendor data
 * @returns {Object} Created vendor
 */
export const createVendor = async (vendorData) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Check for duplicate email
    const [existing] = await connection.execute(
      'SELECT vendor_id FROM vendors WHERE email = ?',
      [vendorData.email]
    );
    
    if (existing.length > 0) {
      throw new Error('Email already registered');
    }
    
    const [result] = await connection.execute(
      `INSERT INTO vendors (first_name, last_name, middle_name, suffix, contact_number, email, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        vendorData.firstName,
        vendorData.lastName,
        vendorData.middleName || null,
        vendorData.suffix || null,
        vendorData.contactNumber,
        vendorData.email,
        vendorData.address
      ]
    );
    
    return { vendor_id: result.insertId, ...vendorData };
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getAllVendors,
  getVendorWithDetails,
  createVendor
};
