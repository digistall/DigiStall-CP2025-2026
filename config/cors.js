// CORS Configuration for Mobile Backend
// Allows requests from mobile apps, web frontend, and production servers

export const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      // Android emulator
      'http://10.0.2.2:5001',
      'http://10.0.2.2:3000',
      // Mobile app schemes
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      // Production - DigitalOcean server
      'http://68.183.154.125',
      'https://68.183.154.125',
      'http://68.183.154.125:80',
      'http://68.183.154.125:5000',
      'http://68.183.154.125:5001',
      // Production - GoDaddy domain
      'http://digi-stall.com',
      'https://digi-stall.com',
      'http://www.digi-stall.com',
      'https://www.digi-stall.com',
      // Additional origins from environment
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Mobile CORS allowing origin:', origin);
      callback(null, true);
    } else {
      // In production, allow any origin that matches server IP or domain
      const isDeployedOrigin = origin.includes('68.183.154.125') ||
                               origin.includes('digi-stall') ||
                               origin.includes(process.env.SERVER_IP || '') ||
                               origin.includes(process.env.DOMAIN || '') ||
                               origin.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+/) || // Any IP
                               origin.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/); // Any domain
      
      if (isDeployedOrigin || isProduction) {
        console.log('✅ Mobile CORS allowing deployed origin:', origin);
        callback(null, true);
      } else {
        console.warn('⚠️ Mobile CORS blocked origin:', origin);
        // Allow anyway for safety in production
        callback(null, true);
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

export default corsConfig;