import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication and sensitive endpoints
// Default: 3 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 3,
  skip: (req) => req.method === 'OPTIONS', // Don't count preflight requests
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many login, registration, or password reset attempts. Please try again after 15 minutes.'
  }
});

// Global rate limiter for general/standard API routes to prevent DoS attacks
// Default: 300 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 300,
  skip: (req) => req.method === 'OPTIONS', // Don't count preflight requests
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
