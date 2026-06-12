// ===== MOBILE APP VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, email, name, phone, password } from './commonSchemas.js';

// POST /api/mobile-staff/inspectors
// POST /api/mobile-staff/collectors
export const createMobileStaffSchema = Joi.object({
  firstName: name.required(),
  lastName: name.required(),
  email: email.required(),
  phoneNumber: phone.allow('', null),
  branchId: id.required(),
  branchManagerId: id.required()
});

// DELETE /api/mobile-staff/inspectors/:id
// DELETE /api/mobile-staff/collectors/:id
export const terminateMobileStaffSchema = Joi.object({
  reason: Joi.string().max(500).trim().allow('', null)
});

// POST /api/mobile-staff/reset-password
export const resetMobileStaffPasswordSchema = Joi.object({
  staffType: Joi.string().valid('inspector', 'collector').required(),
  staffId: id.required(),
  newPassword: password.allow('', null) // Optional auto-generation if omitted
});

// POST /api/mobile/stallholder/app-access-log
export const logAppAccessSchema = Joi.object({
  screen: Joi.string().max(100).trim().required()
});
