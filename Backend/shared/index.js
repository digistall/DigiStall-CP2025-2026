// ===== SHARED MODULE INDEX =====
// Main entry point for shared core libraries

// Database & ORM
export { prisma, testConnection, disconnect } from './database/prismaClient.js';

// Repositories (Data Access Layer)
export * from './repositories/index.js';

// Services (Business Logic Layer)
export * from './services/index.js';

// BFF Adapters
export * as WebBFF from './bff/web/index.js';
export * as MobileBFF from './bff/mobile/index.js';

// Utilities
export * from './utils/index.js';
