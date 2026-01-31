/**
 * STALL-HOLDER - Mobile Backend Services Index
 * Central export for all stallholder mobile services
 */

import stallholderService, {
  getStallholderProfile,
  getStallholderStalls,
  getPaymentHistory,
  submitComplaint
} from './stallholderService.js';

export {
  stallholderService,
  getStallholderProfile,
  getStallholderStalls,
  getPaymentHistory,
  submitComplaint
};

export default stallholderService;
