import { performance } from 'perf_hooks';

// Keep references to original console methods (retrieved from global cache if early silencing ran)
export const originalConsoleLog = global._originalConsoleLog || console.log;
export const originalConsoleError = global._originalConsoleError || console.error;
export const originalConsoleWarn = global._originalConsoleWarn || console.warn;

// System-level loggers that bypass production silencing
export const systemLog = (...args) => {
  originalConsoleLog.apply(console, args);
};

export const systemError = (...args) => {
  originalConsoleError.apply(console, args);
};

export const systemWarn = (...args) => {
  originalConsoleWarn.apply(console, args);
};

// Helper function to get local time formatted as hh:mm:ss AM/PM
export const getFormattedTimestamp = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

// Helper function to sanitize endpoint paths
export const sanitizePath = (path) => {
  if (!path) return '';
  return path
    .replace(/\/[0-9]+/g, '/:id') // Numeric IDs
    .replace(/\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g, '/:uuid') // UUIDs
    .replace(/\/[\w\.-]+@[\w\.-]+\.[\w\.-]+/g, '/:email'); // Emails in path
};

/**
 * productionLogger middleware
 * Intercepts requests and logs a standardized transaction line in production format.
 */
export const productionLogger = (req, res, next) => {
  const startTime = performance.now();
  const appId = process.env.APP_ID || 'tfclp';
  const requestPath = req.path || req.originalUrl.split('?')[0];

  // Exclude OPTIONS requests and static files/favicon if needed
  if (req.method === 'OPTIONS' || req.path.startsWith('/uploads') || req.path === '/favicon.ico') {
    return next();
  }

  // Intercept write and end to track response size in bytes
  let responseSize = 0;
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk, encoding, callback) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }
    return originalWrite.apply(res, arguments);
  };

  res.end = function (chunk, encoding, callback) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }
    return originalEnd.apply(res, arguments);
  };

  res.on('finish', () => {
    const duration = (performance.now() - startTime).toFixed(3);
    const size = res.get('Content-Length') || responseSize || 0;
    const sanitizedPath = sanitizePath(requestPath);
    const timestamp = getFormattedTimestamp();

    // Log the transaction line using the original console.log to ensure it prints
    originalConsoleLog(
      `${timestamp} [${appId}] ${req.method} ${sanitizedPath} ${res.statusCode} ${duration} ms - ${size}`
    );
  });

  next();
};

export default productionLogger;
