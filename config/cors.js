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

    // Fallback to specific allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'http://68.183.154.125',  // DigitalOcean production server
      'http://68.183.154.125:80', // DigitalOcean with explicit port
    ]

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Log rejected origin for debugging
    console.log('CORS rejected origin:', origin)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
