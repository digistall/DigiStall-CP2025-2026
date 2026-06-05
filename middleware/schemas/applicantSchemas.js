// ===== APPLICANT VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, email, name, phone, shortText, mediumText, longText, base64Image, isoDate, genderEnum } from './commonSchemas.js';

// POST /api/landing-applicants/stall-application (createStallApplication)
export const createStallApplicationSchema = Joi.object({
  // Personal Information
  applicant_full_name: Joi.string().max(200).trim().required(),
  applicant_contact_number: Joi.string().max(20).trim().allow('', null),
  applicant_address: mediumText.allow('', null),
  applicant_birthdate: Joi.alternatives().try(isoDate, Joi.string().max(20)).allow('', null),
  applicant_civil_status: Joi.string().max(50).trim().allow('', null),
  applicant_educational_attainment: Joi.string().max(100).trim().allow('', null),
  gender: genderEnum.allow('', null),

  // Business Information
  nature_of_business: Joi.string().max(200).trim().allow('', null),
  capitalization: Joi.alternatives().try(Joi.number(), Joi.string().max(50)).allow('', null),
  source_of_capital: Joi.string().max(200).trim().allow('', null),
  previous_business_experience: Joi.string().max(500).trim().allow('', null),
  relative_stall_owner: Joi.string().max(200).trim().allow('', null),

  // Spouse Information (optional)
  spouse_full_name: Joi.string().max(200).trim().allow('', null),
  spouse_birthdate: Joi.alternatives().try(isoDate, Joi.string().max(20)).allow('', null),
  spouse_educational_attainment: Joi.string().max(100).trim().allow('', null),
  spouse_contact_number: Joi.string().max(20).trim().allow('', null),
  spouse_occupation: Joi.string().max(200).trim().allow('', null),

  // Other Information
  signature_of_applicant: Joi.string().max(500).allow('', null),
  house_sketch_location: Joi.string().max(500).allow('', null),
  valid_id: Joi.string().max(500).allow('', null),
  email_address: email.allow('', null),

  // Document base64 data
  signature_data: base64Image.allow('', null),
  house_location_data: base64Image.allow('', null),
  valid_id_data: base64Image.allow('', null),
  branch_id: id.allow(null),

  // Application Information
  stall_id: id.required(),
  application_date: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null)
}).options({ allowUnknown: true }); // Allow additional document fields

// POST /api/landing-applicants (createApplicant — simpler form)
export const createApplicantSchema = Joi.object({
  applicant_full_name: Joi.string().max(200).trim().required(),
  applicant_contact_number: Joi.string().max(20).trim().allow('', null),
  applicant_address: mediumText.allow('', null),
  applicant_birthdate: Joi.alternatives().try(isoDate, Joi.string().max(20)).allow('', null),
  applicant_civil_status: Joi.string().max(50).trim().allow('', null),
  gender: genderEnum.allow('', null),
  email_address: email.allow('', null),
  branch_id: id.allow(null),
  stall_id: id.allow(null)
}).options({ allowUnknown: true });

// PUT /api/applicants/:id/status
export const updateApplicantStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Approved', 'Declined', 'Rejected', 'Under Review').required()
});

// PUT /api/applicants/:id/approve
export const approveApplicantSchema = Joi.object({
  approved_by: id.allow(null),
  notes: longText.allow('', null)
}).options({ allowUnknown: true }).allow({});

// PUT /api/applicants/:id/decline
export const declineApplicantSchema = Joi.object({
  reason: Joi.string().max(1000).trim().allow('', null),
  declined_by: id.allow(null)
}).options({ allowUnknown: true }).allow({});

// POST /api/applicants/documents/blob/upload
export const uploadApplicantDocumentBlobSchema = Joi.object({
  applicant_id: id.required(),
  document_type_id: id.allow(null),
  document_type: Joi.string().max(50).trim().allow('', null),
  document_data: base64Image.required(),
  file_name: Joi.string().max(255).trim().allow('', null)
});

// PUT /api/applicants/documents/blob/:document_id/verify
export const verifyDocumentSchema = Joi.object({
  verification_status: Joi.string().valid('Verified', 'Rejected', 'Pending').required(),
  verified_by: id.allow(null),
  notes: Joi.string().max(500).trim().allow('', null)
});
