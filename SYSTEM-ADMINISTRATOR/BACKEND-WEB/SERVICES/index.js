/**
 * SYSTEM-ADMINISTRATOR - Backend Services Index
 * Central export for all admin services
 */

import adminService, {
  getSystemStats,
  logActivity,
  getSetting
} from './adminService.js';

export {
  adminService,
  getSystemStats,
  logActivity,
  getSetting
};

export default adminService;
