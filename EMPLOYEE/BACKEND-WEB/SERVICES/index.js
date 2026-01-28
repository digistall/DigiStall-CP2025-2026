/**
 * EMPLOYEE - Web Backend Services Index
 * Central export for all employee web services
 */

import employeeService, {
  getAllEmployees,
  createEmployee,
  updateEmployee
} from './employeeService.js';

export {
  employeeService,
  getAllEmployees,
  createEmployee,
  updateEmployee
};

export default employeeService;
