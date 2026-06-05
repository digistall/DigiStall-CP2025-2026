// ===== STALLHOLDER VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, email, name, phone, mediumText, isoDate, genderEnum, statusEnum } from './commonSchemas.js';

// POST /api/stallholders-management
export const createStallholderSchema = Joi.object({
  applicant_id: id.required(),
  stall_id: id.required(),
  status: statusEnum.default('Active'),
  contract_start: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  contract_end: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null)
});

// PUT /api/stallholders-management/:id
export const updateStallholderSchema = Joi.object({
  stall_id: id.allow(null),
  status: statusEnum.allow('', null),
  contract_start: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  contract_end: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null)
});

// POST /api/stallholders-management/import-data
export const importStallholdersSchema = Joi.object({
  data: Joi.array().items(Joi.object({
    stall_number: Joi.string().max(50).required(),
    first_name: name.required(),
    last_name: name.required(),
    contact_number: phone,
    email: email.allow('', null),
    gender: genderEnum.allow('', null),
    address: mediumText.allow('', null),
    contract_start: Joi.string().allow('', null),
    contract_end: Joi.string().allow('', null)
  })).min(1).required()
}).options({ allowUnknown: true });
