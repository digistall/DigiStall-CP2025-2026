/**
 * DIGISTALL - Main Entry Point
 * 
 * This module provides exports for all user-role-based modules
 * following the MVC + BFF architecture pattern.
 */

// Shared modules
export * as shared from './SHARED/index.js';

// Export user-role modules
export * as systemAdmin from './SYSTEM_ADMINISTRATOR/index.js';
export * as businessOwner from './BUSINESS_OWNER/index.js';
export * as branchManager from './BRANCH_MANAGER/index.js';
export * as stallHolder from './STALL_HOLDER/index.js';
export * as employee from './EMPLOYEE/index.js';
export * as vendor from './VENDOR/index.js';
export * as applicants from './APPLICANTS/index.js';
export * as publicLandingPage from './PUBLIC-LANDINGPAGE/index.js';
