// ===== NAGA STALL UNIFIED BACKEND SERVER =====
// Combined backend for both Landing Page and Management functions

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createConnection, initializeDatabase } from './config/database.js';
import { corsConfig } from './config/cors.js';
import { getPerformanceStats } from './config/performanceMonitor.js';
import authMiddleware from './middleware/auth.js';
import enhancedAuthMiddleware from './middleware/enhancedAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
// REMOVED: decryptResponseMiddleware - stored procedures handle decryption
// import { decryptResponseMiddleware } from './middleware/dataProtection.js';

// Load environment variables
dotenv.config();

// Import route files
import authRoutes from './routes/authRoutes.js';
import enhancedAuthRoutes from './routes/enhancedAuthRoutes.js';
import applicantRoutes from './routes/applicantRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import landingApplicantRoutes from './routes/landingApplicantRoutes.js';
import stallRoutes from './routes/stallRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import stallholderRoutes from './routes/stallholderRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import mobileStaffRoutes from './routes/mobileStaffRoutes.js';
import staffActivityLogRoutes from './routes/activityLog/staffActivityLogRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import dashboardSubscriptionRoutes from './routes/dashboardSubscriptionRoutes.js';
import { getComplianceEvidenceImage } from './controllers/compliances/complianceController.js';
const app = express();
const PORT = process.env.WEB_PORT || 3001;

// ===== MIDDLEWARE =====
// Increased limits to handle large base64 images (100MB = ~75MB actual data)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser()); // For handling httpOnly cookies
app.use(cors(corsConfig));

// REMOVED: Auto-decrypt middleware - stored procedures already decrypt data
// app.use(decryptResponseMiddleware);

// Request logging disabled to prevent console flooding
// Enable for debugging: uncomment below
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   if (req.body && Object.keys(req.body).length > 0) {
//     console.log('Request body:', JSON.stringify(req.body, null, 2));
//   }
//   next();
// });

// ===== ROUTES =====

// Public routes (no authentication required)
app.get('/api/compliances/:id/evidence/image', getComplianceEvidenceImage);
app.use('/api/auth/v2', enhancedAuthRoutes);    // Enhanced JWT auth with refresh tokens (NEW)
app.use('/api/auth', authRoutes);               // Legacy auth routes (backward compatibility)
app.use('/api/stalls', stallRoutes);            // Stalls routes (public for landing page + protected for admin)
app.use('/api/applications', applicationRoutes); // Applications (public for submissions)
app.use('/api/landing-applicants', landingApplicantRoutes); // Landing page applicant submissions (public)
app.use('/api/employees', employeeRoutes);      // Employee routes (login is public, others protected internally)
app.use('/api/documents', documentRoutes);      // Document blob routes (public for preview)

// Management routes (authentication required)
// Use enhancedAuthMiddleware for new implementation, authMiddleware for backward compatibility
app.use('/api/applicants', enhancedAuthMiddleware.authenticateToken, applicantRoutes);
app.use('/api/branches', enhancedAuthMiddleware.authenticateToken, branchRoutes);
app.use('/api/stallholders', enhancedAuthMiddleware.authenticateToken, stallholderRoutes);
app.use('/api/compliances', enhancedAuthMiddleware.authenticateToken, complianceRoutes);
app.use('/api/complaints', enhancedAuthMiddleware.authenticateToken, complaintRoutes);
app.use('/api/payments', enhancedAuthMiddleware.authenticateToken, paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes); // Has its own auth middleware
app.use('/api/mobile-staff', enhancedAuthMiddleware.authenticateToken, mobileStaffRoutes); // Mobile staff (inspectors/collectors)
console.log('📱 Mobile staff routes registered at /api/mobile-staff');

// Vendor routes (for vendor management)
app.use('/api/vendors', vendorRoutes);
console.log('🏪 Vendor routes registered at /api/vendors');

// Activity log routes (for monitoring staff activities)
app.use('/api/activity-logs', staffActivityLogRoutes);
console.log('📊 Activity log routes registered at /api/activity-logs');

// Dashboard subscription routes (SSE for real-time updates)
app.use('/api/dashboard-subscription', dashboardSubscriptionRoutes);
console.log('📡 Dashboard subscription routes registered at /api/dashboard-subscription');

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const connection = await createConnection();
    await connection.execute('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    await connection.end();
    
    const perfStats = getPerformanceStats();
    
    res.status(200).json({
      success: true,
      message: 'Server and database are healthy',
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        database: 'connected',
        dbResponseTime: `${dbResponseTime}ms`
      },
      performance: perfStats
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        database: 'error'
      }
    });
  }
});

// ===== ROOT ENDPOINT =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Naga Stall Management System - Unified Backend API',
    version: '1.0.0',
    features: {
      landingPage: 'Stall browsing and applications',
      management: 'Admin, branch, and employee management',
      mobile: 'Mobile app support'
    },
    endpoints: {
      auth: '/api/auth',
      stalls: '/api/stalls',
      applications: '/api/applications',
      applicants: '/api/applicants',
      branches: '/api/branches',
      employees: '/api/employees',
      stallholders: '/api/stallholders',
      vendors: '/api/vendors',
      compliances: '/api/compliances',
      complaints: '/api/complaints',
      payments: '/api/payments',
      subscriptions: '/api/subscriptions',
      health: '/api/health'
    }
  });
});

// ===== ERROR HANDLING =====
app.use(errorHandler);

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/auth',
      '/api/stalls',
      '/api/applications',
      '/api/applicants',
      '/api/branches',
      '/api/employees',
      '/api/stallholders',
      '/api/compliances',
      '/api/complaints',
      '/api/payments',
      '/api/vendors',
      '/api/subscriptions',
      '/api/health'
    ]
  });
});

// ===== SERVER STARTUP =====
app.listen(PORT, async () => {
  console.log(`
🚀 Naga Stall Management System - Unified Backend
📍 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}

📋 Available Services:
   🏪 Landing Page API  - Stall browsing and applications
   🔧 Management API    - Admin and employee functions
   📱 Mobile API        - Mobile app support

🔗 Health Check: http://localhost:${PORT}/api/health
📚 API Documentation: http://localhost:${PORT}/
  `);

//  Test database connection and initialize tables
  try {
    console.log('🔍 Testing database connection...');
    const connection = await createConnection();
    await connection.execute('SELECT 1');
    await connection.end();
    console.log('✅ Database connection successful');
    
    // Initialize database tables (non-blocking - run in background)
    initializeDatabase()
      .then(() => console.log('✅ Database tables initialized'))
      .catch(error => console.error('⚠️ Database initialization warning:', error.message));
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('⚠️ Server will continue running, but database features may not work.');
    console.error('💡 Please check:');
    console.error('   1. DigitalOcean database is running');
    console.error('   2. Firewall allows connections from your IP');
    console.error('   3. Database credentials are correct');
    console.error('   4. Network connectivity to DigitalOcean');
  }
});