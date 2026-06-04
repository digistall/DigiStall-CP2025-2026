// ===== EMPLOYEE VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, email, name, phone, password } from './commonSchemas.js';

// POST /api/employees
export const createEmployeeSchema = Joi.object({
  firstName: name.required(),
  lastName: name.required(),
  email: email.required(),
  phoneNumber: phone,
  branchId: id.allow(null),
  permissions: Joi.array().items(Joi.string().max(50)).max(20).allow(null),
  createdByManager: id.allow(null)
});

// POST /api/employees/login
export const employeeLoginSchema = Joi.object({
  username: Joi.string().max(255).trim().allow('', null),
  email: email.allow('', null),
  password: Joi.string().max(128).required()
}).or('username', 'email');

// PUT /api/employees/:id
export const updateEmployeeSchema = Joi.object({
  firstName: name.allow('', null),
  lastName: name.allow('', null),
  email: email.allow('', null),
  phoneNumber: phone,
  permissions: Joi.array().items(Joi.string().max(50)).max(20).allow(null),
  status: Joi.string().valid('Active', 'Inactive', 'Suspended').allow(null),
  updatedBy: id.allow(null)
});

// PUT /api/employees/:id/permissions
export const updatePermissionsSchema = Joi.object({
  permissions: Joi.array().items(Joi.string().max(50)).max(20).required()
});

// POST /api/employees/:id/reset-password
export const resetEmployeePasswordSchema = Joi.object({
  newPassword: Joi.string().max(128).allow('', null),
  resetBy: id.allow(null)
});

// DELETE /api/employees/:id
export const deleteEmployeeSchema = Joi.object({
  deletedBy: id.allow(null)
}).allow({});

// POST /api/employees/logout
export const employeeLogoutSchema = Joi.object({
  sessionToken: Joi.string().max(500).allow('', null)
}).allow({});
