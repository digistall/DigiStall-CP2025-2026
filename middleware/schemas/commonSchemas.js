// ===== COMMON VALIDATION SCHEMAS =====
// Shared Joi types reused across domain-specific schemas

import Joi from 'joi';

// ===== PRIMITIVE TYPES =====

/** Positive integer ID (for database primary/foreign keys) */
export const id = Joi.number().integer().positive();

/** Required positive integer ID */
export const requiredId = id.required();

/** Email address — trimmed, lowercased, max 255 chars */
export const email = Joi.string().email({ tlds: { allow: false } }).max(255).trim().lowercase();

/** Person name — trimmed, max 100 chars */
export const name = Joi.string().max(100).trim();

/** Phone number — trimmed, max 20 chars */
export const phone = Joi.string().max(20).trim().allow('', null);

/** Password — min 8, max 128 chars */
export const password = Joi.string().min(8).max(128);

/** Short text — max 200 chars */
export const shortText = Joi.string().max(200).trim();

/** Medium text — max 500 chars */
export const mediumText = Joi.string().max(500).trim();

/** Long text — max 5000 chars (descriptions, notes) */
export const longText = Joi.string().max(5000).trim();

/** Base64 encoded image data — max ~15 MB of base64 (≈ 11 MB raw) */
export const base64Image = Joi.string().max(15_000_000);

/** ISO date string (YYYY-MM-DD) */
export const isoDate = Joi.date().iso();

/** Positive number (for money, amounts) */
export const positiveNumber = Joi.number().positive();

/** Boolean value */
export const booleanValue = Joi.boolean();

// ===== PARAM SCHEMAS =====

/** Validates a single :id route parameter */
export const paramId = Joi.object({
  id: id.required()
});

/** Validates a :stallId route parameter */
export const paramStallId = Joi.object({
  stallId: id.required()
});

/** Validates a :branchId route parameter */
export const paramBranchId = Joi.object({
  branchId: id.required()
});

// ===== ENUM HELPERS =====

/** Common status values */
export const statusEnum = Joi.string().valid(
  'Active', 'Inactive', 'Pending', 'Approved', 'Declined', 'Rejected', 'Suspended'
).trim();

/** Priority levels */
export const priorityEnum = Joi.string().valid('low', 'medium', 'high', 'urgent').trim();

/** Gender values */
export const genderEnum = Joi.string().valid('Male', 'Female', 'Other', 'male', 'female', 'other').trim();

/** Payment method values */
export const paymentMethodEnum = Joi.string().valid('Cash', 'GCash', 'Bank Transfer', 'Check', 'Online', 'cash', 'gcash', 'bank_transfer', 'check', 'online').trim();

export default {
  id, requiredId, email, name, phone, password,
  shortText, mediumText, longText, base64Image,
  isoDate, positiveNumber, booleanValue,
  paramId, paramStallId, paramBranchId,
  statusEnum, priorityEnum, genderEnum, paymentMethodEnum
};
