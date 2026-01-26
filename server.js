// ===== DIGISTALL - MVC ROLE-BASED BACKEND SERVER =====
// Main server entry point using new folder structure
// Run: node server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import shared config
import { corsConfig } from './CONFIG/cors.js';
import { createConnection, testConnection } from './CONFIG/database.js';

// Import shared middleware
import authMiddleware from './MIDDLEWARE/auth.js';
import enhancedAuthMiddleware from './MIDDLEWARE/enhancedAuth.js';
import { errorHandler } from './MIDDLEWARE/errorHandler.js';

// Import session cleanup service (auto-logout inactive users)
import { startSessionCleanup } from './SERVICES/sessionCleanupService.js';

// ===== IMPORT ROUTES =====
// LGU-NAGA (Business Owner) routes
import stallRoutes from './ROUTES/stallRoutes.js';
import complaintRoutes from './ROUTES/complaintRoutes.js';
import complianceRoutes from './ROUTES/complianceRoutes.js';
import stallholderRoutes from './ROUTES/stallholderRoutes.js';
import paymentRoutes from './ROUTES/paymentRoutes.js';
import employeeRoutes from './ROUTES/employeeRoutes.js';
import vendorRoutes from './ROUTES/vendorRoutes.js';
import branchRoutes from './ROUTES/branchRoutes.js';
import subscriptionRoutes from './ROUTES/subscriptionRoutes.js';
import dashboardSubscriptionRoutes from './ROUTES/dashboardSubscriptionRoutes.js';

// APPLICANTS routes
import applicationRoutes from './ROUTES/applicationRoutes.js';
import landingApplicantRoutes from './ROUTES/landingApplicantRoutes.js';

// EMPLOYEE Mobile routes
import inspectorRoutes from './ROUTES/inspectorRoutes.js';
import mobileStaffRoutes from './ROUTES/mobileStaffRoutes.js';

// AUTH routes
import webAuthRoutes from './ROUTES/webAuthRoutes.js';  // Web auth (email login)
import mobileAuthRoutes from './ROUTES/authRoutes.js';  // Mobile auth
import loginRouter from './ROUTES/loginRouter.js';

// STALL-HOLDER Mobile routes
import stallholderMobileRoutes from './ROUTES/stallholderRoutes.js';
import userRoutes from './ROUTES/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(cors(corsConfig));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('\n========================================');
console.log('  DIGISTALL - MVC ROLE-BASED SERVER');
console.log('  New Folder Structure');
console.log('========================================\n');

// ===== API ROUTES =====

// PUBLIC ROUTES (No authentication)
app.use('/api/applications', applicationRoutes);
app.use('/api/landing-applicants', landingApplicantRoutes);
app.use('/api/stalls', stallRoutes);  // Some routes are public (landing page)

// AUTH ROUTES
app.use('/api/auth', webAuthRoutes);  // Web login (email/password)
app.use('/api/mobile/login', loginRouter);
app.use('/api/mobile/auth', mobileAuthRoutes);  // Mobile auth

// LGU-NAGA (Business Owner) ROUTES
app.use('/api/complaints', enhancedAuthMiddleware.authenticateToken, complaintRoutes);
app.use('/api/compliances', enhancedAuthMiddleware.authenticateToken, complianceRoutes);
app.use('/api/stallholders', enhancedAuthMiddleware.authenticateToken, stallholderRoutes);
app.use('/api/payments', enhancedAuthMiddleware.authenticateToken, paymentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/vendors', enhancedAuthMiddleware.authenticateToken, vendorRoutes);
app.use('/api/branches', enhancedAuthMiddleware.authenticateToken, branchRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/dashboard-subscription', dashboardSubscriptionRoutes);  // SSE for real-time dashboard updates
console.log('✅ LGU-NAGA routes loaded');

// EMPLOYEE ROUTES (Inspector, Collector)
app.use('/api/inspector', enhancedAuthMiddleware.authenticateToken, inspectorRoutes);
app.use('/api/mobile-staff', enhancedAuthMiddleware.authenticateToken, mobileStaffRoutes);
console.log('✅ EMPLOYEE routes loaded');

// STALL-HOLDER Mobile ROUTES
app.use('/api/mobile/stallholder', stallholderMobileRoutes);
app.use('/api/mobile/user', userRoutes);
console.log('✅ STALL-HOLDER routes loaded');

// VENDOR ROUTES
console.log('✅ VENDOR routes loaded');

// APPLICANTS ROUTES
console.log('✅ APPLICANTS routes loaded');

// AUTH ROUTES
console.log('✅ AUTH routes loaded');

// Error handler
app.use(errorHandler);

// ===== START SERVER =====
async function startServer() {
  console.log('📦 Testing database connection...');
  const dbTest = await testConnection();
  
  if (dbTest.success) {
    console.log('✅ Database connection successful\n');
    
    // Start session cleanup service (auto-logout inactive users)
    startSessionCleanup();
  } else {
    console.log('⚠️  Database connection failed - continuing without DB\n');
  }
  
  app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log('========================================\n');
    console.log('Role folders active:');
    console.log('  • LGU-NAGA (Business Owner)');
    console.log('  • BRANCH-MANAGER');
    console.log('  • STALL-HOLDER');
    console.log('  • EMPLOYEE (Inspector, Collector)');
    console.log('  • VENDOR');
    console.log('  • APPLICANTS');
    console.log('  • AUTH');
    console.log('  • PUBLIC-LANDINGPAGE');
    console.log('\n💡 Press Ctrl+C to stop\n');
  });
}

startServer();
