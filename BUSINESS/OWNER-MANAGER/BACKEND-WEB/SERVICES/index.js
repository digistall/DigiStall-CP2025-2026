/**
 * BUSINESS/OWNER-MANAGER - Backend Services Index
 * Central export for all owner/manager services
 */

import branchService, { getAllBranchesWithStats, getBranchRevenue } from './branchService.js';
import subscriptionService, { getSubscriptionSummary, getExpiringSubscriptions } from './subscriptionService.js';

export {
  branchService,
  getAllBranchesWithStats,
  getBranchRevenue,
  subscriptionService,
  getSubscriptionSummary,
  getExpiringSubscriptions
};

export default {
  branchService,
  subscriptionService
};
