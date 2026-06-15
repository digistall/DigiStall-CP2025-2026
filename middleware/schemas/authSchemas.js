// ===== AUTH VALIDATION SCHEMAS =====
import Joi from 'joi';
import { email, password, name, phone, mediumText, isoDate, genderEnum } from './commonSchemas.js';

// POST /api/auth/login
export const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().max(128).required()
});

// POST /api/auth/verify-email-exists
export const verifyEmailSchema = Joi.object({
  email: email.required()
});

// POST /api/auth/store-reset-code
export const storeResetCodeSchema = Joi.object({
  email: email.required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'Code must be exactly 6 digits' })
});

// POST /api/auth/verify-reset-code
export const verifyResetCodeSchema = Joi.object({
  email: email.required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'Code must be exactly 6 digits' })
});

// POST /api/auth/resend-reset-code
export const resendResetCodeSchema = Joi.object({
  email: email.required()
});

// POST /api/auth/reset-password
export const resetPasswordSchema = Joi.object({
  email: email.required(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  newPassword: password.required()
});

// POST /api/auth/logout
export const logoutSchema = Joi.object({
  userId: Joi.alternatives().try(Joi.number().integer(), Joi.string().max(50)).allow(null),
  userType: Joi.string().max(50).allow(null, ''),
  sessionToken: Joi.string().max(500).allow(null, '')
}).allow({});

// POST /api/auth/heartbeat
export const heartbeatSchema = Joi.object({
  userId: Joi.alternatives().try(Joi.number().integer(), Joi.string().max(50)).allow(null),
  userType: Joi.string().max(50).allow(null, ''),
  sessionToken: Joi.string().max(500).allow(null, '')
}).allow({});

// PUT /api/auth/profile/update
export const updateProfileSchema = Joi.object({
  firstName: name.allow('', null),
  lastName: name.allow('', null),
  phone: phone,
  address: mediumText.allow('', null),
  dob: Joi.alternatives().try(isoDate, Joi.string().max(20).allow('', null)).allow(null),
  gender: genderEnum.allow('', null)
});

// POST /api/auth/create-business-owner
export const createBusinessOwnerSchema = Joi.object({
  username: Joi.string().max(100).trim().required(),
  password: Joi.string().max(128).required(),
  firstName: name.required(),
  lastName: name.required(),
  email: email.required(),
  contactNumber: phone
});

// POST /api/auth/hash-password
export const hashPasswordSchema = Joi.object({
  password: Joi.string().max(128).required()
});

// Mobile auth: POST /api/mobile/auth/login
export const mobileLoginSchema = Joi.object({
  username: Joi.string().max(255).trim().required(),
  password: Joi.string().max(128).required()
});

// Mobile auth: POST /api/mobile/auth/register
export const mobileRegisterSchema = Joi.object({
  username: Joi.string().max(255).trim().required(),
  password: Joi.string().min(8).max(128).required(),
  email: email.allow('', null),
  fullName: Joi.string().max(200).trim().allow('', null)
});

// Mobile auth: POST /api/mobile/auth/change-password
export const mobileChangePasswordSchema = Joi.object({
  currentPassword: Joi.string().max(128).required(),
  newPassword: password.required()
});

// Mobile staff login: POST /api/mobile/auth/staff-login
export const mobileStaffLoginSchema = Joi.object({
  username: Joi.string().max(255).trim().required(),
  password: Joi.string().max(128).required()
});

// Mobile vendor login
export const vendorLoginSchema = Joi.object({
  email: email.allow('', null),
  username: Joi.string().max(255).trim().allow('', null),
  password: Joi.string().max(128).required()
});
