/**
 * EMPLOYEE - Mobile Backend Services Index
 * Central export for all employee mobile services
 */

import employeeService, {
  getStallholdersByBranch,
  decryptStallholderFields,
  getInspectorById,
  getCollectorById
} from './employeeService.js';

export {
  employeeService,
  getStallholdersByBranch,
  decryptStallholderFields,
  getInspectorById,
  getCollectorById
};

export default employeeService;
