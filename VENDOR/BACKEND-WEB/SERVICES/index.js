/**
 * VENDOR - Backend Services Index
 * Central export for all vendor services
 */

import vendorService, {
  getAllVendors,
  getVendorWithDetails,
  createVendor
} from './vendorService.js';

export {
  vendorService,
  getAllVendors,
  getVendorWithDetails,
  createVendor
};

export default vendorService;
