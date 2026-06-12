// ===== VENDOR VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, email, name, phone, mediumText, isoDate, genderEnum, statusEnum } from './commonSchemas.js';

// POST /api/vendors
export const createVendorSchema = Joi.object({
  user_account_id: id.allow(null),
  branch_id: id.required(),
  stall_id: id.required(),
  first_name: name.required(),
  last_name: name.required(),
  contact_number: phone,
  email: email.allow('', null),
  address: mediumText.allow('', null),
  gender: genderEnum.allow('', null),
  birthdate: Joi.alternatives().try(isoDate, Joi.string().max(20)).allow('', null),
  valid_id_type: Joi.string().max(100).trim().allow('', null),
  valid_id_number: Joi.string().max(100).trim().allow('', null),
  status: statusEnum.allow('', null),
  business_name: Joi.string().max(200).trim().allow('', null),
  products_sold: mediumText.allow('', null)
});

// PUT /api/vendors/:id
export const updateVendorSchema = Joi.object({
  branch_id: id.allow(null),
  stall_id: id.allow(null),
  first_name: name.allow('', null),
  last_name: name.allow('', null),
  contact_number: phone.allow('', null),
  email: email.allow('', null),
  address: mediumText.allow('', null),
  gender: genderEnum.allow('', null),
  birthdate: Joi.alternatives().try(isoDate, Joi.string().max(20)).allow('', null),
  valid_id_type: Joi.string().max(100).trim().allow('', null),
  valid_id_number: Joi.string().max(100).trim().allow('', null),
  status: statusEnum.allow('', null),
  business_name: Joi.string().max(200).trim().allow('', null),
  products_sold: mediumText.allow('', null)
});
