/**
 * AUTH - User Model
 * Database abstraction for user-related operations
 */

import { createConnection } from '../../../config/database.js';

/**
 * User Model Class
 * Provides database operations for user entities
 */
class UserModel {
  /**
   * Find user by username
   * @param {string} username - Username to search
   * @returns {Object|null} User data
   */
  static async findByUsername(username) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'CALL sp_getMobileUserByUsername(?)',
        [username]
      );
      const users = result[0] || [];
      return users.length > 0 ? users[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email to search
   * @returns {Object|null} User data
   */
  static async findByEmail(email) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM credentials WHERE email = ? AND status = "active"',
        [email]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} User data
   */
  static async findById(userId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'SELECT * FROM credentials WHERE registration_id = ?',
        [userId]
      );
      return result.length > 0 ? result[0] : null;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update user's last login
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  static async updateLastLogin(userId) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE credentials SET last_login = NOW() WHERE registration_id = ?',
        [userId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} passwordHash - New password hash
   * @returns {boolean} Success status
   */
  static async updatePassword(userId, passwordHash) {
    let connection;
    try {
      connection = await createConnection();
      const [result] = await connection.execute(
        'UPDATE credentials SET password_hash = ?, updated_at = NOW() WHERE registration_id = ?',
        [passwordHash, userId]
      );
      return result.affectedRows > 0;
    } finally {
      if (connection) await connection.end();
    }
  }
}

export default UserModel;
