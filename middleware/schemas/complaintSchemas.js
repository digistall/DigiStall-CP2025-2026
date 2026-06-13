// ===== COMPLAINT VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, name, email, phone, shortText, mediumText, longText, priorityEnum } from './commonSchemas.js';

// POST /api/complaints (Web admin/public)
export const createComplaintSchema = Joi.object({
  complaint_type: Joi.string().max(100).trim().required(),
  sender_name: Joi.string().max(200).trim().required(),
  sender_contact: phone.allow('', null),
  sender_email: email.allow('', null),
  stallholder_id: id.allow(null),
  stall_id: id.allow(null),
  branch_id: id.allow(null),
  subject: Joi.string().max(300).trim().required(),
  description: longText.required(),
  evidence: Joi.string().max(5000000).allow('', null), // Changed from mediumText to support base64 images
  priority: priorityEnum.allow('', null)
});

// POST /api/mobile/stallholder/complaint (Mobile App)
export const createMobileComplaintSchema = Joi.object({
  complaint_type: Joi.string().max(100).trim().required(),
  stall_id: id.allow(null),
  branch_id: id.allow(null),
  subject: Joi.string().max(300).trim().required(),
  description: longText.required(),
  evidence: Joi.string().max(5000000).allow('', null) // Base64 string up to ~5MB (~3.7MB image)
});

// PUT /api/complaints/:id
export const updateComplaintSchema = Joi.object({
  complaint_type: Joi.string().max(100).trim().allow('', null),
  subject: Joi.string().max(300).trim().allow('', null),
  description: longText.allow('', null),
  priority: priorityEnum.allow('', null),
  status: Joi.string().valid('pending', 'in-progress', 'resolved', 'rejected').allow('', null)
});

// PUT /api/complaints/:id/resolve
export const resolveComplaintSchema = Joi.object({
  resolution_notes: longText.required(),
  status: Joi.string().valid('resolved', 'rejected').allow('', null)
});

