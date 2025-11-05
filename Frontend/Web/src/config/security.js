// ===== PRODUCTION SECURITY CONFIGURATION =====
// This file configures security settings for production deployment

import SecureLogger from './../utils/secureLogger.js';

/**
 * Configure application for production environment
 */
export function configureProductionSecurity() {
  
  // Disable all debug logging
  SecureLogger.disableDebugLogs();
  
  // Override console methods in production to prevent sensitive data exposure
  if (import.meta.env.PROD) {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Override console.log to filter sensitive data
    console.log = function(...args) {
      // Only allow specific safe log messages in production
      const safeMessages = [
        'Application initialized',
        'User authenticated',
        'User logged out',
        'Navigation',
        'Component mounted',
        'Component unmounted'
      ];
      
      const message = args[0];
      if (typeof message === 'string' && safeMessages.some(safe => message.includes(safe))) {
        originalLog.apply(console, args);
      }
      // In production, sensitive logs are suppressed
    };
    
    // Keep error logging but sanitize
    console.error = function(...args) {
      const sanitizedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return SecureLogger.maskSensitiveData(arg);
        }
        return arg;
      });
      originalError.apply(console, sanitizedArgs);
    };
    
    // Keep warnings
    console.warn = originalWarn;
  }
}

/**
 * Configure application for development environment
 */
export function configureDevelopmentSecurity() {
  // Enable debug logging in development
  SecureLogger.enableDebugLogs();
  
  // Show security reminder in development
  console.warn('🔒 DEVELOPMENT MODE: Debug logging enabled. Disable in production!');
}

/**
 * Auto-configure based on environment
 */
export function autoConfigureSecurity() {
  if (import.meta.env.PROD) {
    configureProductionSecurity();
    console.log('🔒 Production security configuration applied');
  } else {
    configureDevelopmentSecurity();
  }
}