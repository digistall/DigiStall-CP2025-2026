// ===== PAYMENT VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, positiveNumber, isoDate, shortText, mediumText, paymentMethodEnum } from './commonSchemas.js';

// POST /api/payments/onsite
export const addOnsitePaymentSchema = Joi.object({
  stallholderId: id.required(),
  amount: positiveNumber.required(),
  paymentDate: Joi.alternatives().try(isoDate, Joi.string().max(30)).required(),
  paymentTime: Joi.string().allow('', null),
  paymentForMonth: Joi.string().allow('', null),
  paymentType: Joi.string().max(50).trim().allow('', null),
  referenceNumber: Joi.string().max(50).trim().required(),
  collectedBy: Joi.string().allow('', null),
  notes: mediumText.allow('', null),
  promiseToPayDate: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  isDistributed: Joi.boolean().allow(null)
}).options({ allowUnknown: true });

// POST /api/payments/violations/pay
export const processViolationPaymentSchema = Joi.object({
  violationId: id.required(),
  paidAmount: positiveNumber.required(),
  paymentReference: Joi.string().max(50).trim().required(),
  notes: mediumText.allow('', null)
}).options({ allowUnknown: true });

// POST /api/payments/daily
export const addDailyPaymentSchema = Joi.object({
  vendorId: id.required(),
  collectorId: id.required(),
  amount: positiveNumber.required(),
  referenceNo: Joi.string().max(50).trim().allow('', null),
  status: Joi.string().allow('', null)
}).options({ allowUnknown: true });

// PUT /api/payments/daily/:receiptId
export const updateDailyPaymentSchema = Joi.object({
  vendorId: id.allow(null),
  collectorId: id.allow(null),
  amount: positiveNumber.allow(null),
  referenceNo: Joi.string().max(50).trim().allow('', null),
  status: Joi.string().allow('', null)
}).options({ allowUnknown: true });
