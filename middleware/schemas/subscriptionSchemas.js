// ===== SUBSCRIPTION VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, name, email, phone, mediumText, positiveNumber, isoDate } from './commonSchemas.js';

// POST /api/subscriptions/business-owner
export const createOwnerSubscriptionSchema = Joi.object({
  username: Joi.string().max(100).trim().required(),
  password: Joi.string().max(128).required(),
  firstName: name.required(),
  lastName: name.required(),
  email: email.required(),
  contactNumber: phone,
  planId: id.required()
});

// POST /api/subscriptions/payment
export const recordSubscriptionPaymentSchema = Joi.object({
  subscriptionId: id.required(),
  businessOwnerId: id.required(),
  amount: positiveNumber.required(),
  paymentDate: isoDate.required(),
  paymentMethod: Joi.string().max(50).trim().allow('', null),
  referenceNumber: Joi.string().max(100).trim().allow('', null),
  periodStart: isoDate.allow('', null),
  periodEnd: isoDate.allow('', null),
  notes: mediumText.allow('', null)
});

// POST /api/subscriptions/change-plan
export const changePlanSchema = Joi.object({
  planId: id.required()
});
