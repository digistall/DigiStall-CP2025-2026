// ===== COMPLIANCE VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, mediumText } from './commonSchemas.js';

// POST /api/compliances
export const createComplianceRecordSchema = Joi.object({
  inspector_id: id.allow(null),
  stallholder_id: id.required(),
  violation_id: id.allow(null),
  stall_id: id.allow(null),
  compliance_type: Joi.string().max(100).trim().when('violation_id', {
    is: null,
    then: Joi.required(),
    otherwise: Joi.allow('', null)
  }),
  severity: Joi.string().valid('minor', 'moderate', 'major', 'critical').allow('', null),
  remarks: mediumText.allow('', null),
  offense_no: Joi.number().integer().min(1).default(1),
  penalty_id: id.allow(null)
});

// PUT /api/compliances/:id
export const updateComplianceRecordSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'complete', 'incomplete').allow('', null),
  remarks: mediumText.allow('', null)
});
