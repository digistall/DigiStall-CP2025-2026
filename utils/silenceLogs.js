import dotenv from 'dotenv';
dotenv.config();

// Capture original console methods before silencing
global._originalConsoleLog = console.log;
global._originalConsoleError = console.error;
global._originalConsoleWarn = console.warn;

// Silence console logs in production to prevent sensitive data leaks
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  // Safely intercept and sanitize console.error in production
  const originalError = global._originalConsoleError;
  console.error = (...args) => {
    const sanitizedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return `[Error] ${arg.message}`;
      }
      return typeof arg === 'object' ? '[Object]' : arg;
    });
    originalError.apply(console, [`${new Date().toLocaleTimeString()} [SYSTEM-ERR]`, ...sanitizedArgs]);
  };
}

