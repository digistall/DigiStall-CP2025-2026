// ===== NAGA STALL MOBILE BACKEND SERVER =====
// Backend server specifically for mobile application

import express from 'express';
import cors from 'cors';
import { createConnection } from './config/database.js';

// Import route files
import loginRoutes from './routes/loginRouter.js';
import stallRoutes from './routes/stallRoutes.js';
import userRoutes from './routes/userRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';

const app = express();
const PORT = process.env.MOBILE_PORT || 5001;

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration for mobile apps
app.use(cors({
  origin: ['http://localhost:3003', 'http://10.0.2.2:5001'], // Include Android emulator IP
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - MOBILE API - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ===== ROUTES =====

// Mobile-specific routes
app.use('/api/mobile/auth', loginRoutes);
app.use('/api/mobile/stalls', stallRoutes);
app.use('/api/mobile/users', userRoutes);
app.use('/api/mobile/applications', applicationRoutes);

// ===== HEALTH CHECK =====
app.get('/api/mobile/health', async (req, res) => {
  try {
    const connection = await createConnection();
    await connection.execute('SELECT 1');
    await connection.end();
    
    res.status(200).json({
      success: true,
      message: 'Mobile backend server and database are healthy',
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        database: 'connected',
        type: 'mobile_backend'
      }
    });
  } catch (error) {
    console.error('Mobile backend health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Mobile backend health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        database: 'error',
        type: 'mobile_backend'
      }
    });
  }
});

// ===== ROOT ENDPOINT =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Naga Stall Management System - Mobile Backend API',
    version: '1.0.0',
    type: 'mobile_backend',
    features: {
      authentication: 'Mobile user login and session management',
      stalls: 'Stall browsing and application management',
      applications: 'Application tracking and status updates'
    },
    endpoints: {
      auth: '/api/mobile/auth',
      stalls: '/api/mobile/stalls',
      users: '/api/mobile/users',
      applications: '/api/mobile/applications',
      health: '/api/mobile/health'
    }
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Mobile backend error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in mobile backend',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Mobile API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/mobile/auth',
      '/api/mobile/stalls',
      '/api/mobile/users',
      '/api/mobile/applications',
      '/api/mobile/health'
    ]
  });
});

// ===== SERVER STARTUP =====
app.listen(PORT, async () => {
  console.log(`
📱 Naga Stall Management System - Mobile Backend
📍 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}

📋 Mobile-Specific Services:
   🔐 Authentication    - Mobile user login
   🏪 Stall Browsing   - Mobile stall discovery
   📝 Applications     - Mobile application management

🔗 Health Check: http://localhost:${PORT}/api/mobile/health
📚 API Documentation: http://localhost:${PORT}/
  `);

  // Test database connection
  try {
    const connection = await createConnection();
    await connection.execute('SELECT 1');
    await connection.end();
    console.log('✅ Mobile backend database connection successful');
  } catch (error) {
    console.error('❌ Mobile backend database connection failed:', error.message);
  }
});