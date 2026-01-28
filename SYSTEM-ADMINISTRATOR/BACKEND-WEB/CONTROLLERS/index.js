/**
 * SYSTEM-ADMINISTRATOR - Backend Controllers Index
 * Central export for all admin controllers
 */

import adminController, {
  getDashboardStats,
  getAllUsers,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings
} from './adminController.js';

export {
  adminController,
  getDashboardStats,
  getAllUsers,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings
};

export default adminController;
