// ===== BRANCH VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, name, email, phone, mediumText, shortText } from './commonSchemas.js';

// POST /api/branches
export const createBranchSchema = Joi.object({
  branch_name: Joi.string().max(200).trim().required(),
  area: mediumText.allow('', null),
  location: mediumText.allow('', null),
  address: mediumText.allow('', null),
  city: Joi.string().max(100).trim().allow('', null),
  description: Joi.string().max(1000).trim().allow('', null),
  business_owner_id: id.allow(null)
});

// POST /api/branches/managers (create branch manager)
export const createBranchManagerSchema = Joi.object({
  firstName: name.required(),
  lastName: name.required(),
  email: email.required(),
  contactNumber: phone,
  branchId: id.required(),
  address: mediumText.allow('', null)
});

// PUT /api/branches/managers/:managerId
export const updateBranchManagerSchema = Joi.object({
  firstName: name.allow('', null),
  lastName: name.allow('', null),
  email: email.allow('', null),
  contactNumber: phone,
  branchId: id.allow(null),
  address: mediumText.allow('', null),
  status: Joi.string().valid('Active', 'Inactive').allow(null)
});

// POST /api/branches/assign-manager
export const assignManagerSchema = Joi.object({
  managerId: id.required(),
  branchId: id.required()
});

// POST /api/branches/floors
export const createFloorSchema = Joi.object({
  floor_name: Joi.string().max(100).trim().required(),
  branch_id: id.required(),
  floor_number: Joi.number().integer().allow(null),
  description: Joi.string().max(500).trim().allow('', null)
});

// PUT /api/branches/floors/:floorId
export const updateFloorSchema = Joi.object({
  floor_name: Joi.string().max(100).trim().allow('', null),
  floor_number: Joi.number().integer().allow(null),
  description: Joi.string().max(500).trim().allow('', null)
});

// POST /api/branches/sections
export const createSectionSchema = Joi.object({
  section_name: Joi.string().max(100).trim().required(),
  floor_id: id.required(),
  description: Joi.string().max(500).trim().allow('', null)
});

// PUT /api/branches/sections/:sectionId
export const updateSectionSchema = Joi.object({
  section_name: Joi.string().max(100).trim().allow('', null),
  description: Joi.string().max(500).trim().allow('', null)
});
