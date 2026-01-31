/**
 * VENDOR - Vendor Model
 * Database abstraction for vendor operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * VendorModel Class
 * Provides database operations for vendor entities
 */
class VendorModel {
  /**
   * Find vendor by ID
   * @param {number} vendorId - Vendor ID
   * @returns {Object|null} Vendor data
   */
  static async findById(vendorId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM vendors WHERE vendor_id = ?',
        [vendorId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find vendor by email
   * @param {string} email - Vendor email
   * @returns {Object|null} Vendor data
   */
  static async findByEmail(email) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM vendors WHERE email = ?',
        [email]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all vendors
   * @param {Object} filters - Filter options
   * @returns {Array} List of vendors
   */
  static async findAll(filters = {}) {
    let connection;
    try {
      connection = await createConnection();
      let query = 'SELECT * FROM vendors WHERE 1=1';
      const params = [];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [result] = await connection.execute(query, params);
      return result;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Create new vendor
   * @param {Object} data - Vendor data
   * @returns {Object} Created vendor
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO vendors (first_name, last_name, middle_name, suffix, contact_number, email, address, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          data.first_name,
          data.last_name,
          data.middle_name || null,
          data.suffix || null,
          data.contact_number,
          data.email,
          data.address
        ]
      );
      return { vendor_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update vendor
   * @param {number} vendorId - Vendor ID
   * @param {Object} data - Update data
   * @returns {boolean} Success status
   */
  static async update(vendorId, data) {
    let connection;
    try {
      connection = await createConnection();
      const fields = [];
      const values = [];
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      values.push(vendorId);
      
      const [result] = await connection.execute(
        `UPDATE vendors SET ${fields.join(', ')} WHERE vendor_id = ?`,
        values
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Delete vendor (soft delete)
   * @param {number} vendorId - Vendor ID
   * @returns {boolean} Success status
   */
  static async delete(vendorId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE vendors SET status = "inactive" WHERE vendor_id = ?',
        [vendorId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default VendorModel;
