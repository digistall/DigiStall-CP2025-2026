// ===== BACKEND-WEB/index.js =====
// Aggregator file that imports and exports ALL backend web routes from MVC role folders
// This single file consolidates all web API routes for easy import

import express from 'express';

// ===== IMPORT ALL BACKEND-WEB ROUTES FROM ROLE FOLDERS =====

// BUSINESS_OWNER Backend Web Routes
import businessOwnerStallRoutes from '../BUSINESS_OWNER/BACKEND-WEB/ROUTES/stallRoutes.js';
import businessOwnerComplaintRoutes from '../BUSINESS_OWNER/BACKEND-WEB/ROUTES/complaintRoutes.js';
import businessOwnerComplianceRoutes from '../BUSINESS_OWNER/BACKEND-WEB/ROUTES/complianceRoutes.js';
import businessOwnerStallholderRoutes from '../BUSINESS_OWNER/BACKEND-WEB/ROUTES/stallholderRoutes.js';
import businessOwnerSubscriptionRoutes from '../BUSINESS_OWNER/BACKEND-WEB/ROUTES/subscriptionRoutes.js';
import businessOwnerPaymentRoutes from '../BUSINESS_OWNER/BACKEND-WEB/ROUTES/paymentRoutes.js';

// BRANCH_MANAGER Backend Web Routes
import branchRoutes from '../BRANCH_MANAGER/BACKEND-WEB/ROUTES/branchRoutes.js';

// EMPLOYEE Backend Web Routes
import employeeRoutes from '../EMPLOYEE/WEB_EMPLOYEE/BACKEND-WEB/ROUTES/employeeRoutes.js';

// VENDOR Backend Web Routes
import vendorRoutes from '../VENDOR/BACKEND-WEB/ROUTES/vendorRoutes.js';

// APPLICANTS Backend Web Routes
import applicantRoutes from '../APPLICANTS/BACKEND-WEB/ROUTES/applicantRoutes.js';
import applicationRoutes from '../APPLICANTS/BACKEND-WEB/ROUTES/applicationRoutes.js';

// PUBLIC-LANDINGPAGE Backend Web Routes
import landingApplicantRoutes from '../PUBLIC-LANDINGPAGE/BACKEND-WEB/ROUTES/landingApplicantRoutes.js';

// ===== EXPORT ALL ROUTES =====
export const routes = {
  // Business Owner
  businessOwner: {
    stalls: businessOwnerStallRoutes,
    complaints: businessOwnerComplaintRoutes,
    compliances: businessOwnerComplianceRoutes,
    stallholders: businessOwnerStallholderRoutes,
    subscriptions: businessOwnerSubscriptionRoutes,
    payments: businessOwnerPaymentRoutes
  },
  
  // Branch Manager
  branchManager: {
    branches: branchRoutes
  },
  
  // Employee
  employee: {
    employees: employeeRoutes
  },
  
  // Vendor
  vendor: {
    vendors: vendorRoutes
  },
  
  // Applicants
  applicants: {
    applicants: applicantRoutes,
    applications: applicationRoutes
  },
  
  // Public Landing Page
  public: {
    landingApplicants: landingApplicantRoutes
  }
};

// ===== HELPER FUNCTION TO REGISTER ALL ROUTES =====
export function registerAllWebRoutes(app, authMiddleware) {
  console.log('\n📦 Registering ALL Backend Web Routes from BACKEND-WEB.js...\n');
  
  // BUSINESS_OWNER routes
  app.use('/api/stalls', routes.businessOwner.stalls);
  app.use('/api/complaints', authMiddleware, routes.businessOwner.complaints);
  app.use('/api/compliances', authMiddleware, routes.businessOwner.compliances);
  app.use('/api/stallholders', authMiddleware, routes.businessOwner.stallholders);
  app.use('/api/subscriptions', routes.businessOwner.subscriptions);
  app.use('/api/payments', authMiddleware, routes.businessOwner.payments);
  console.log('  👔 BUSINESS_OWNER routes loaded');
  
  // BRANCH_MANAGER routes
  app.use('/api/branches', authMiddleware, routes.branchManager.branches);
  console.log('  🏢 BRANCH_MANAGER routes loaded');
  
  // EMPLOYEE routes
  app.use('/api/employees', routes.employee.employees);
  console.log('  👷 EMPLOYEE routes loaded');
  
  // VENDOR routes
  app.use('/api/vendors', routes.vendor.vendors);
  console.log('  🛒 VENDOR routes loaded');
  
  // APPLICANTS routes
  app.use('/api/applicants', authMiddleware, routes.applicants.applicants);
  app.use('/api/applications', routes.applicants.applications);
  console.log('  📝 APPLICANTS routes loaded');
  
  // PUBLIC routes
  app.use('/api/landing-applicants', routes.public.landingApplicants);
  console.log('  🌐 PUBLIC-LANDINGPAGE routes loaded');
  
  console.log('\n✅ All Backend Web routes registered!\n');
}

// ===== INDIVIDUAL EXPORTS FOR SELECTIVE IMPORTS =====
export {
  // Business Owner
  businessOwnerStallRoutes,
  businessOwnerComplaintRoutes,
  businessOwnerComplianceRoutes,
  businessOwnerStallholderRoutes,
  businessOwnerSubscriptionRoutes,
  businessOwnerPaymentRoutes,
  
  // Branch Manager
  branchRoutes,
  
  // Employee
  employeeRoutes,
  
  // Vendor
  vendorRoutes,
  
  // Applicants
  applicantRoutes,
  applicationRoutes,
  
  // Public
  landingApplicantRoutes
};

export default routes;
