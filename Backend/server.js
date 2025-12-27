// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createConnection, initializeDatabase } from './config/database.js';
import { corsConfig } from './config/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import authMiddleware from './middleware/auth.js';
import { activityLogger } from './Backend-Web/middleware/activityLogger.js';
import './Backend-Web/services/cleanupScheduler.js'; // Initialize cleanup scheduler

// Import Web routes (from Backend-Web)
import webAuthRoutes from './Backend-Web/routes/authRoutes.js';
import webApplicantRoutes from './Backend-Web/routes/applicantRoutes.js';
import webApplicationRoutes from './Backend-Web/routes/applicationRoutes.js';
import webLandingApplicantRoutes from './Backend-Web/routes/landingApplicantRoutes.js';
import webStallRoutes from './Backend-Web/routes/stallRoutes.js';
import webBranchRoutes from './Backend-Web/routes/branchRoutes.js';
import webEmployeeRoutes from './Backend-Web/routes/employeeRoutes.js';
import stallholderRoutes from './Backend-Web/routes/stallholderRoutes.js';
import paymentRoutes from './Backend-Web/routes/paymentRoutes.js';
import complianceRoutes from './Backend-Web/routes/complianceRoutes.js';
import complaintRoutes from './Backend-Web/routes/complaintRoutes.js';
import subscriptionRoutes from './Backend-Web/routes/subscriptionRoutes.js';
import mobileStaffRoutes from './Backend-Web/routes/mobileStaffRoutes.js';
import staffActivityLogRoutes from './Backend-Web/routes/activityLog/staffActivityLogRoutes.js';

// Import Mobile routes (from Backend-Mobile)
import mobileAuthRoutes from './Backend-Mobile/routes/authRoutes.js';
import mobileStallRoutes from './Backend-Mobile/routes/stallRoutes.js';
import mobileApplicationRoutes from './Backend-Mobile/routes/applicationRoutes.js';
import mobileStallholderRoutes from './Backend-Mobile/routes/stallholderRoutes.js';
import mobileInspectorRoutes from './Backend-Mobile/routes/inspectorRoutes.js';

const app = express();
const WEB_PORT = process.env.WEB_PORT || 3001;
const MOBILE_PORT = process.env.MOBILE_PORT || 5001;

// ===== MIDDLEWARE =====
app.use(cors(corsConfig));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for uploaded documents
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'Backend-Mobile', 'uploads')));

// Serve stall images from digistall_uploads path (for Docker compatibility)
// In Docker: /app/uploads/stalls, locally: C:/xampp/htdocs/digistall_uploads/stalls
const stallUploadsDir = process.env.UPLOAD_DIR_STALLS || 'C:/xampp/htdocs/digistall_uploads/stalls';
app.use('/digistall_uploads/stalls', express.static(stallUploadsDir));

// Serve applicant documents from digistall_uploads path
const applicantUploadsDir = process.env.UPLOAD_DIR_APPLICANTS || 'C:/xampp/htdocs/digistall_uploads/applicants';
app.use('/digistall_uploads/applicants', express.static(applicantUploadsDir));

// ===== WEB ROUTES (Backend-Web functionality) =====
// Public web routes (no authentication required)
app.use('/api/auth', webAuthRoutes);
app.use('/api/stalls', webStallRoutes);           // Stalls routes (public for landing page + protected for admin)
app.use('/api/applications', webApplicationRoutes); // Applications (public for submissions)
app.use('/api/landing-applicants', webLandingApplicantRoutes); // Landing page applicant submissions (public)
app.use('/api/employees', webEmployeeRoutes);     // Employee routes (login is public, others protected internally)

// Management web routes (authentication required)
app.use('/api/applicants', authMiddleware.authenticateToken, activityLogger, webApplicantRoutes);
app.use('/api/branches', authMiddleware.authenticateToken, activityLogger, webBranchRoutes);
app.use('/api/stallholders', authMiddleware.authenticateToken, activityLogger, stallholderRoutes);
app.use('/api/payments', authMiddleware.authenticateToken, activityLogger, paymentRoutes);
app.use('/api/compliances', authMiddleware.authenticateToken, activityLogger, complianceRoutes);
app.use('/api/complaints', authMiddleware.authenticateToken, activityLogger, complaintRoutes);
app.use('/api/subscriptions', activityLogger, subscriptionRoutes); // Subscription management (System Admin only - auth handled internally)
app.use('/api/mobile-staff', authMiddleware.authenticateToken, activityLogger, mobileStaffRoutes); // Mobile staff (inspectors/collectors)
app.use('/api/activity-logs', staffActivityLogRoutes); // Staff activity logs (auth handled internally)
console.log('📊 Activity log routes registered at /api/activity-logs');
console.log('📊 Activity logger middleware enabled for protected routes');

// ===== MOBILE ROUTES (Backend-Mobile functionality) =====
// Mobile API routes with /mobile prefix to differentiate
app.use('/mobile/api/auth', mobileAuthRoutes);
app.use('/mobile/api/stalls', mobileStallRoutes);
app.use('/mobile/api/applications', mobileApplicationRoutes);
app.use('/api/mobile/stallholder', mobileStallholderRoutes); // Stallholder document management for mobile
app.use('/api/mobile/inspector', mobileInspectorRoutes); // Inspector routes for mobile

// Mobile areas endpoint (separate from stalls)
app.get('/mobile/api/areas', async (req, res) => {
  const { getAvailableAreas } = await import('./Backend-Mobile/controllers/stall/stallController.js');
  getAvailableAreas(req, res);
});

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    const connection = await createConnection();
    await connection.end();
    
    res.status(200).json({
      success: true,
      message: 'Unified server is running and database connection is healthy',
      timestamp: new Date().toISOString(),
      services: {
        web: `http://localhost:${WEB_PORT}`,
        mobile: `Mobile API available at /mobile/api/*`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.json({
    message: 'Naga Stall Management System - Unified Backend',
    version: '2.0.0',
    status: 'active',
    services: {
      'Web API': 'Landing Page and Management functions',
      'Mobile API': 'Mobile application functions'
    },
    endpoints: {
      web: {
        health: '/api/health',
        auth: '/api/auth/*',
        stalls: '/api/stalls/*',
        applications: '/api/applications/*',
        employees: '/api/employees/*',
        applicants: '/api/applicants/*',
        branches: '/api/branches/*'
      },
      mobile: {
        auth: '/mobile/api/auth/*',
        stalls: '/mobile/api/stalls/*',
        applications: '/mobile/api/applications/*'
      }
    }
  });
});

// ===== ERROR HANDLING =====
app.use(errorHandler);

// ===== SERVER STARTUP =====
const startServer = async () => {
  try {
    // Test database connection and initialize tables
    console.log('🔧 Testing database connection...');
    const connection = await createConnection();
    await connection.end();
    console.log('✅ Database connection successful');
    
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database tables initialized');
    
    // Start the server on all interfaces
    const server = app.listen(WEB_PORT, '0.0.0.0', () => {
      console.log(`
🚀 Naga Stall Management System - Unified Backend
📍 Server running on port ${WEB_PORT}
📡 Listening on all interfaces (0.0.0.0)
🌐 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}

📋 Available Services:
   🏪 Web API          - Landing Page and Management functions
   📱 Mobile API       - Mobile application functions (/mobile/api/*)

🔗 Health Check: http://localhost:${WEB_PORT}/api/health
📚 API Documentation: http://localhost:${WEB_PORT}/

🎯 Service Endpoints:
   Web Frontend:    http://localhost:${WEB_PORT}/api/*
   Mobile App:      http://localhost:${WEB_PORT}/mobile/api/*
      `);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${WEB_PORT} is already in use. Please close other applications using this port or change the port in .env file.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;