// ===== DOCUMENT VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, longText } from './commonSchemas.js';

// PUT /api/documents/:documentId/review
export const reviewDocumentSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'Approved', 'Rejected').required(),
  rejection_reason: longText.allow('', null),
  remarks: longText.allow('', null)
});

// POST /api/stallholders/documents/requirements
export const createDocumentRequirementSchema = Joi.object({
  branch_id: id.required(),
  document_type_id: id.required(),
  is_required: Joi.boolean().default(true),
  instructions: longText.allow('', null)
});

// PUT /api/stallholders/documents/requirements/:documentTypeId
export const updateDocumentRequirementSchema = Joi.object({
  branch_id: id.required(),
  is_required: Joi.boolean(),
  instructions: longText.allow('', null)
});
