// ===== ASSIGNED LOCATION VALIDATION SCHEMAS =====
import Joi from 'joi';

// POST /api/assigned-locations
export const createAssignedLocationSchema = Joi.object({
  location_name: Joi.string().max(100).trim().required().messages({
    'string.empty': 'Location name is required.',
    'string.max': 'Location name must not exceed 100 characters.',
    'any.required': 'Location name is required.'
  })
});

// PUT /api/assigned-locations/:id
export const updateAssignedLocationSchema = Joi.object({
  location_name: Joi.string().max(100).trim().required().messages({
    'string.empty': 'Location name is required.',
    'string.max': 'Location name must not exceed 100 characters.',
    'any.required': 'Location name is required.'
  })
});

// GET /api/assigned-locations (query string validation)
export const getAssignedLocationsQuerySchema = Joi.object({
  search: Joi.string().max(100).trim().allow('', null),
  sortBy: Joi.string().valid('location_name', 'created_at').allow('', null),
  sortDir: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').allow('', null),
  page: Joi.number().integer().min(1).allow(null),
  pageSize: Joi.number().integer().min(1).max(100).allow(null)
});
