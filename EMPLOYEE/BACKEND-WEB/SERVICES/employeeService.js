/**
 * EMPLOYEE - Web Backend Services
 * Employee-related services for web dashboard
 */

import { createConnection } from '../../../config/database.js';
import { encryptData, decryptData, decryptEmployees } from '../../../services/encryptionService.js';

/**
 * Get all employees with decryption
 * @param {number} branchId - Optional branch filter
 * @returns {Array} List of decrypted employees
 */
export const getAllEmployees = async (branchId = null) => {
  let connection;
  try {
    connection = await createConnection();
    let query = 'SELECT * FROM employees';
    let params = [];
    
    if (branchId) {
      query += ' WHERE branch_id = ?';
      params.push(branchId);
    }
    
    const [results] = await connection.execute(query, params);
    return decryptEmployees(results);
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Create new employee
 * @param {Object} employeeData - Employee data
 * @returns {Object} Created employee
 */
export const createEmployee = async (employeeData) => {
  let connection;
  try {
    connection = await createConnection();
    
    const encryptedData = {
      ...employeeData,
      full_name: employeeData.full_name ? encryptData(employeeData.full_name) : null,
      email: employeeData.email ? encryptData(employeeData.email) : null,
      contact_number: employeeData.contact_number ? encryptData(employeeData.contact_number) : null,
    };
    
    const [result] = await connection.execute(
      `INSERT INTO employees (full_name, email, contact_number, branch_id, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        encryptedData.full_name,
        encryptedData.email,
        encryptedData.contact_number,
        encryptedData.branch_id,
        encryptedData.role,
        encryptedData.status || 'active'
      ]
    );
    
    return { id: result.insertId, ...employeeData };
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Update employee
 * @param {number} employeeId - Employee ID
 * @param {Object} updateData - Data to update
 * @returns {boolean} Success status
 */
export const updateEmployee = async (employeeId, updateData) => {
  let connection;
  try {
    connection = await createConnection();
    
    const encryptedData = {
      ...updateData,
      full_name: updateData.full_name ? encryptData(updateData.full_name) : undefined,
      email: updateData.email ? encryptData(updateData.email) : undefined,
      contact_number: updateData.contact_number ? encryptData(updateData.contact_number) : undefined,
    };
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    Object.entries(encryptedData).forEach(([key, value]) => {
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
};

export default {
  getAllEmployees,
  createEmployee,
  updateEmployee
};
