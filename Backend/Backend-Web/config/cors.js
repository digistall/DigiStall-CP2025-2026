export const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    // Allow localhost on any port for development (both localhost and 127.0.0.1)
    if (origin && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true)
    }

    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) for development
    if (origin && origin.match(/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/)) {
      return callback(null, true)
    }

    // Production domains and server
    const allowedOrigins = [
      // Local development
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      // Production - DigitalOcean server
      'http://68.183.154.125',
      'https://68.183.154.125',
      'http://68.183.154.125:80',
      'http://68.183.154.125:5000',
      'http://68.183.154.125:5001',
      // Production - GoDaddy domain (IMPORTANT!)
      'http://digi-stall.com',
      'https://digi-stall.com',
      'http://www.digi-stall.com',
      'https://www.digi-stall.com',
    ]

    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowing origin:', origin)
      return callback(null, true)
    }

    // Allow any origin that matches production patterns
    if (origin.includes('digi-stall') || origin.includes('68.183.154.125')) {
      console.log('✅ CORS allowing production origin:', origin)
      return callback(null, true)
    }

    // In production, allow all origins to prevent errors
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ CORS allowing origin (production mode):', origin)
      return callback(null, true)
    }

    // Log rejected origin for debugging but still allow
    console.warn('⚠️ CORS allowing unknown origin:', origin)
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}