// ===== SECURE LOGGER UTILITY =====
// Provides safe logging that masks sensitive information

// Check if we're in development mode
const DEVELOPMENT = import.meta.env?.MODE === 'development' || 
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

const ENABLE_DEBUG_LOGS = DEVELOPMENT && !window.DISABLE_DEBUG_LOGS;

class SecureLogger {
  
  /**
   * Mask sensitive data in objects
   */
  static maskSensitiveData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = [
      'password', 'token', 'accessToken', 'refreshToken', 'jwt',
      'email', 'username', 'phone', 'contact', 'address',
      'firstName', 'lastName', 'fullName', 'name',
      'passwordHash', 'hash', 'secret', 'key'
    ];
    
    const masked = { ...data };
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        if (typeof masked[field] === 'string') {
          if (field.includes('password') || field.includes('token') || field.includes('secret')) {
            masked[field] = '[REDACTED]';
          } else if (field === 'email') {
            masked[field] = this.maskEmail(masked[field]);
          } else {
            masked[field] = this.maskString(masked[field]);
          }
        }
      }
    }
    
    return masked;
  }
  
  /**
   * Mask email addresses
   */
  static maskEmail(email) {
    if (!email || !email.includes('@')) return '[MASKED_EMAIL]';
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? local.substring(0, 2) + '***' : '***';
    return `${maskedLocal}@${domain}`;
  }
  
  /**
   * Mask strings
   */
  static maskString(str) {
    if (!str || str.length <= 2) return '***';
    return str.substring(0, 2) + '***';
  }
  
  /**
   * Safe info logging
   */
  static info(message, data = null) {
    if (!ENABLE_DEBUG_LOGS) return;
    
    if (data) {
      console.log(message, this.maskSensitiveData(data));
    } else {
      console.log(message);
    }
  }
  
  /**
   * Safe error logging
   */
  static error(message, error = null) {
    if (error) {
      // Only log error message and type, not full stack trace with sensitive data
      console.error(message, {
        message: error.message,
        name: error.name,
        code: error.code
      });
    } else {
      console.error(message);
    }
  }
  
  /**
   * Safe debug logging (only in development)
   */
  static debug(message, data = null) {
    if (!DEVELOPMENT) return;
    
    if (data) {
      console.log(`🔍 DEBUG: ${message}`, this.maskSensitiveData(data));
    } else {
      console.log(`🔍 DEBUG: ${message}`);
    }
  }
  
  /**
   * Authentication specific logging
   */
  static auth(message, data = null) {
    if (!ENABLE_DEBUG_LOGS) return;
    
    if (data) {
      const safeData = {
        ...this.maskSensitiveData(data),
        // Keep some useful info for debugging
        userType: data.userType,
        hasToken: !!data.token,
        hasPassword: !!data.password,
        passwordLength: data.password?.length
      };
      console.log(`🔐 AUTH: ${message}`, safeData);
    } else {
      console.log(`🔐 AUTH: ${message}`);
    }
  }
  
  /**
   * Disable all debug logging (for production)
   */
  static disableDebugLogs() {
    window.DISABLE_DEBUG_LOGS = true;
  }
  
  /**
   * Enable debug logging (for development)
   */
  static enableDebugLogs() {
    window.DISABLE_DEBUG_LOGS = false;
  }
  
  /**
   * Network request logging
   */
  static network(message, data = null) {
    if (!ENABLE_DEBUG_LOGS) return;
    
    if (data) {
      const safeData = {
        url: data.url,
        method: data.method,
        status: data.status,
        hasData: !!data.data,
        dataType: typeof data.data
      };
      console.log(`🌐 NETWORK: ${message}`, safeData);
    } else {
      console.log(`🌐 NETWORK: ${message}`);
    }
  }
}

export default SecureLogger;