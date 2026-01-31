/**
 * AUTH - Web User Model
 * Database abstraction for web user-related operations
 */

import { createConnection } from '../../../CONFIG/database.js';

/**
 * WebUserModel Class
 * Provides database operations for web user entities
 */
class WebUserModel {
  /**
   * Find user by email and type
   * @param {string} email - Email to search
   * @param {string} userType - Type of user (admin, manager, employee)
   * @returns {Object|null} User data
   */
  static async findByEmailAndType(email, userType) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'CALL sp_getWebUserByEmail(?, ?)',
        [email, userType]
      );
      const users = result[0] || [];
      return users.length > 0 ? users[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find admin by email
   * @param {string} email - Email to search
   * @returns {Object|null} Admin data
   */
  static async findAdminByEmail(email) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM admins WHERE email = ? AND status = "active"',
        [email]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find manager by email
   * @param {string} email - Email to search
   * @returns {Object|null} Manager data
   */
  static async findManagerByEmail(email) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM branch_managers WHERE email = ? AND status = "active"',
        [email]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find employee by email
   * @param {string} email - Email to search
   * @returns {Object|null} Employee data
   */
  static async findEmployeeByEmail(email) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM employees WHERE email = ? AND status = "active"',
        [email]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default WebUserModel;
