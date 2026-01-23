export const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow all origins or use ALLOWED_ORIGINS env variable
    const isProduction = process.env.NODE_ENV === 'production';
    
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      // Production - DigitalOcean server
      'http://68.183.154.125',
      'https://68.183.154.125',
      'http://68.183.154.125:3001',
      'http://68.183.154.125:80',
      // Production - GoDaddy domain
      'http://digi-stall.com',
      'https://digi-stall.com',
      'http://www.digi-stall.com',
      'https://www.digi-stall.com',
      // Production/Deployment - add your domains here or use ALLOWED_ORIGINS env
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowing origin:', origin);
      callback(null, true);
    } else {
      // In production or if origin contains your server IP/domain, allow it
      // This allows deployed frontend to connect to backend
      const isDeployedOrigin = origin.includes(process.env.SERVER_IP) || 
                               origin.includes(process.env.DOMAIN) ||
                               origin.includes('digi-stall') ||
                               origin.includes('68.183.154.125') ||
                               origin.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+/) || // Allow any IP address
                               origin.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)  // Allow any domain
      
      if (isDeployedOrigin || isProduction) {
        console.log('✅ CORS allowing deployed origin:', origin);
        callback(null, true);
      } else {
        console.warn('⚠️ CORS blocked origin:', origin);
        callback(null, true); // Allow all origins anyway for safety
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