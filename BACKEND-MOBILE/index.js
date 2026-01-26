// ===== BACKEND-MOBILE/index.js =====
// Aggregator file that imports and exports ALL backend mobile routes from MVC role folders
// This single file consolidates all mobile API routes for easy import

import express from 'express';

// ===== IMPORT ALL BACKEND-MOBILE ROUTES FROM ROLE FOLDERS =====

// STALL_HOLDER Backend Mobile Routes
import stallholderAuthRoutes from '../STALL_HOLDER/BACKEND-MOBILE/ROUTES/authRoutes.js';
import stallholderLoginRoutes from '../STALL_HOLDER/BACKEND-MOBILE/ROUTES/loginRouter.js';
import stallholderRoutes from '../STALL_HOLDER/BACKEND-MOBILE/ROUTES/stallholderRoutes.js';
import stallholderStallRoutes from '../STALL_HOLDER/BACKEND-MOBILE/ROUTES/stallRoutes.js';

// EMPLOYEE Backend Mobile Routes
import inspectorRoutes from '../EMPLOYEE/INSPECTOR/BACKEND-MOBILE/ROUTES/inspectorRoutes.js';
import collectorRoutes from '../EMPLOYEE/COLLECTOR/BACKEND-MOBILE/ROUTES/mobileStaffRoutes.js';

// APPLICANTS Backend Mobile Routes
import applicantMobileRoutes from '../APPLICANTS/BACKEND-MOBILE/ROUTES/applicationRoutes.js';

// ===== EXPORT ALL ROUTES =====
export const routes = {
  // Stall Holder (Mobile)
  stallHolder: {
    auth: stallholderAuthRoutes,
    login: stallholderLoginRoutes,
    stallholder: stallholderRoutes,
    stalls: stallholderStallRoutes
  },
  
  // Employee (Mobile)
  employee: {
    inspector: inspectorRoutes,
    collector: collectorRoutes
  },
  
  // Applicants (Mobile)
  applicants: {
    applications: applicantMobileRoutes
  }
};

// ===== HELPER FUNCTION TO REGISTER ALL MOBILE ROUTES =====
export function registerAllMobileRoutes(app, authMiddleware) {
  console.log('\n📱 Registering ALL Backend Mobile Routes from BACKEND-MOBILE.js...\n');
  
  // STALL_HOLDER mobile routes
  app.use('/api/mobile/auth', routes.stallHolder.auth);
  app.use('/api/mobile/login', routes.stallHolder.login);
  app.use('/api/mobile/stallholder', routes.stallHolder.stallholder);
  app.use('/api/mobile/stalls', routes.stallHolder.stalls);
  console.log('  🏪 STALL_HOLDER mobile routes loaded');
  
  // EMPLOYEE mobile routes
  app.use('/api/mobile/inspector', authMiddleware, routes.employee.inspector);
  app.use('/api/mobile/collector', authMiddleware, routes.employee.collector);
  console.log('  👷 EMPLOYEE mobile routes loaded');
  
  // APPLICANTS mobile routes
  app.use('/api/mobile/applications', routes.applicants.applications);
  console.log('  📝 APPLICANTS mobile routes loaded');
  
  console.log('\n✅ All Backend Mobile routes registered!\n');
}

// ===== INDIVIDUAL EXPORTS FOR SELECTIVE IMPORTS =====
export {
  // Stall Holder
  stallholderAuthRoutes,
  stallholderLoginRoutes,
  stallholderRoutes,
  stallholderStallRoutes,
  
  // Employee
  inspectorRoutes,
  collectorRoutes,
  
  // Applicants
  applicantMobileRoutes
};

export default routes;
