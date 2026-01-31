/**
 * EMPLOYEE - Web Backend Employee Model
 * Database abstraction for employee-related operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * EmployeeModel Class
 * Provides database operations for employee entities
 */
class EmployeeModel {
  /**
   * Find employee by ID
   * @param {number} employeeId - Employee ID
   * @returns {Object|null} Employee data
   */
  static async findById(employeeId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM employees WHERE employee_id = ?',
        [employeeId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Get all employees
   * @param {Object} filters - Filter options
   * @returns {Array} List of employees
   */
  static async findAll(filters = {}) {
    let connection;
    try {
      connection = await createConnection();
      let query = 'SELECT * FROM employees WHERE 1=1';
      const params = [];
      
      if (filters.branchId) {
        query += ' AND branch_id = ?';
        params.push(filters.branchId);
      }
      
      if (filters.role) {
        query += ' AND role = ?';
        params.push(filters.role);
      }
      
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
   * Create new employee
   * @param {Object} data - Employee data
   * @returns {Object} Created employee
   */
  static async create(data) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        `INSERT INTO employees (full_name, email, contact_number, branch_id, role, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [data.full_name, data.email, data.contact_number, data.branch_id, data.role]
      );
      return { employee_id: result.insertId, ...data };
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update employee
   * @param {number} employeeId - Employee ID
   * @param {Object} data - Update data
   * @returns {boolean} Success status
   */
  static async update(employeeId, data) {
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
      
      values.push(employeeId);
      
      const [result] = await connection.execute(
        `UPDATE employees SET ${fields.join(', ')} WHERE employee_id = ?`,
        values
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Delete employee (soft delete)
   * @param {number} employeeId - Employee ID
   * @returns {boolean} Success status
   */
  static async delete(employeeId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE employees SET status = "inactive" WHERE employee_id = ?',
        [employeeId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default EmployeeModel;
