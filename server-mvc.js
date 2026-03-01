// ===== NAGA STALL - MVC ROLE-BASED BACKEND SERVER =====
// Uses aggregator files (BACKEND-WEB.js, BACKEND-MOBILE.js) for routes
// Config and middleware from SHARED folder
// Run: node server-mvc.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env') });

// Import from SHARED folder (config, middleware)
import { createConnection, testConnection } from './SHARED/config/database.js';
import { corsConfig } from './SHARED/config/cors.js';
import { getPerformanceStats } from './SHARED/config/performanceMonitor.js';
import authMiddleware from './SHARED/middleware/auth.js';
import enhancedAuthMiddleware from './SHARED/middleware/enhancedAuth.js';
import { errorHandler } from './SHARED/middleware/errorHandler.js';

// ===== IMPORT ALL BACKEND WEB ROUTES FROM AGGREGATOR =====
import {
  businessOwnerStallRoutes,
  businessOwnerComplaintRoutes,
  businessOwnerComplianceRoutes,
  businessOwnerStallholderRoutes,
  businessOwnerSubscriptionRoutes,
  businessOwnerPaymentRoutes,
  branchRoutes,
  employeeRoutes,
  vendorRoutes,
  applicantRoutes,
  applicationRoutes,
  landingApplicantRoutes
} from './BACKEND-WEB/index.js';

// ===== IMPORT ALL BACKEND MOBILE ROUTES FROM AGGREGATOR =====
import {
  stallholderAuthRoutes,
  stallholderLoginRoutes,
  stallholderRoutes,
  inspectorRoutes,
  collectorRoutes,
  applicantMobileRoutes
} from './BACKEND-MOBILE/index.js';

const app = express();
const PORT = process.env.WEB_PORT || 3001;

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(cors(corsConfig));

console.log('\n========================================');
console.log('  NAGA STALL - MVC ROLE-BASED SERVER');
console.log('  Using Aggregator Files');
console.log('========================================\n');

// ===== ROUTES =====

// Public routes (no authentication required)
app.use('/api/applications', applicationRoutes);
app.use('/api/landing-applicants', landingApplicantRoutes);

// ROLE-BASED ROUTES (from BACKEND-WEB.js aggregator)

// BUSINESS_OWNER routes
app.use('/api/stalls', businessOwnerStallRoutes);
app.use('/api/complaints', enhancedAuthMiddleware.authenticateToken, businessOwnerComplaintRoutes);
app.use('/api/compliances', enhancedAuthMiddleware.authenticateToken, businessOwnerComplianceRoutes);
app.use('/api/stallholders', enhancedAuthMiddleware.authenticateToken, businessOwnerStallholderRoutes);
app.use('/api/subscriptions', businessOwnerSubscriptionRoutes);
app.use('/api/payments', enhancedAuthMiddleware.authenticateToken, businessOwnerPaymentRoutes);
console.log('👔 BUSINESS_OWNER routes loaded (from BACKEND-WEB.js)');

// BRANCH_MANAGER routes
app.use('/api/branches', enhancedAuthMiddleware.authenticateToken, branchRoutes);
console.log('🏢 BRANCH_MANAGER routes loaded (from BACKEND-WEB.js)');

// EMPLOYEE routes
app.use('/api/employees', employeeRoutes);
app.use('/api/inspector', enhancedAuthMiddleware.authenticateToken, inspectorRoutes);
app.use('/api/mobile-staff', enhancedAuthMiddleware.authenticateToken, collectorRoutes);
console.log('👷 EMPLOYEE routes loaded (from BACKEND-WEB.js & BACKEND-MOBILE.js)');

// STALL_HOLDER routes (from BACKEND-MOBILE.js aggregator)
app.use('/api/mobile/auth', stallholderAuthRoutes);
app.use('/api/mobile/login', stallholderLoginRoutes);
app.use('/api/mobile/stallholder', stallholderRoutes);
console.log('🏪 STALL_HOLDER routes loaded (from BACKEND-MOBILE.js)');

// VENDOR routes
app.use('/api/vendors', vendorRoutes);
console.log('🛒 VENDOR routes loaded (from BACKEND-WEB.js)');

// APPLICANTS routes
app.use('/api/applicants', enhancedAuthMiddleware.authenticateToken, applicantRoutes);
app.use('/api/mobile/applications', applicantMobileRoutes);
console.log('📝 APPLICANTS routes loaded (from BACKEND-WEB.js & BACKEND-MOBILE.js)');

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    const connection = await createConnection();
    await connection.execute('SELECT 1');
    connection.release();
    
    const stats = getPerformanceStats();
    res.json({
      status: 'healthy',
      server: 'MVC Role-Based Server',
      timestamp: new Date().toISOString(),
      database: 'connected',
      performance: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Error handler
app.use(errorHandler);

// ===== START SERVER =====
async function startServer() {
  // Test database connection (non-blocking)
  console.log('📦 Testing database connection...');
  const dbTest = await testConnection();
  
  if (dbTest.success) {
    console.log('✅ Database connection successful\n');
  } else {
    console.log('⚠️  Database connection failed - using MOCK DATA for development\n');
  }
  
  // Start server regardless of database status (mock data fallback available)
  app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 MVC Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log('========================================\n');
    console.log('Role folders active:');
    console.log('  • BUSINESS_OWNER');
    console.log('  • BRANCH_MANAGER');
    console.log('  • EMPLOYEE');
    console.log('  • STALL_HOLDER');
    console.log('  • VENDOR');
    console.log('  • APPLICANTS');
    if (!dbTest.success) {
      console.log('\n⚠️  MOCK DATA MODE - Database unavailable\n');
    }
    console.log('\n💡 Press Ctrl+C to stop\n');
  });
}

startServer();
