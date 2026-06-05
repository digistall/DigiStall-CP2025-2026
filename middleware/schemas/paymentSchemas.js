// ===== PAYMENT VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, positiveNumber, isoDate, shortText, mediumText, paymentMethodEnum } from './commonSchemas.js';

// POST /api/payments/onsite
export const addOnsitePaymentSchema = Joi.object({
  stallholder_id: id.required(),
  amount: positiveNumber.required(),
  payment_date: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  receipt_number: Joi.string().max(50).trim().allow('', null),
  payment_method: paymentMethodEnum.allow('', null),
  payment_type: Joi.string().max(50).trim().allow('', null),
  period_start: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  period_end: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  notes: mediumText.allow('', null),
  recorded_by: id.allow(null),
  branch_id: id.allow(null),
  stall_id: id.allow(null)
}).options({ allowUnknown: true });

// POST /api/payments/violations/pay
export const processViolationPaymentSchema = Joi.object({
  violation_id: id.required(),
  amount: positiveNumber.required(),
  payment_method: paymentMethodEnum.allow('', null),
  receipt_number: Joi.string().max(50).trim().allow('', null),
  notes: mediumText.allow('', null),
  recorded_by: id.allow(null)
}).options({ allowUnknown: true });

// POST /api/payments/daily
export const addDailyPaymentSchema = Joi.object({
  vendor_id: id.required(),
  collector_id: id.required(),
  amount: positiveNumber.required(),
  payment_date: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  receipt_number: Joi.string().max(50).trim().allow('', null),
  notes: mediumText.allow('', null),
  branch_id: id.allow(null),
  stall_id: id.allow(null)
}).options({ allowUnknown: true });

// PUT /api/payments/daily/:receiptId
export const updateDailyPaymentSchema = Joi.object({
  vendor_id: id.allow(null),
  collector_id: id.allow(null),
  amount: positiveNumber.allow(null),
  payment_date: Joi.alternatives().try(isoDate, Joi.string().max(30)).allow('', null),
  notes: mediumText.allow('', null)
}).options({ allowUnknown: true });
