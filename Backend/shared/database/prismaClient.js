// ===== PRISMA CLIENT SINGLETON =====
// Ensures only one instance of PrismaClient is used across the application
// This prevents connection pool exhaustion during development with hot-reload

import { PrismaClient } from '../generated/prisma-client/index.js';

// PrismaClient singleton for connection pooling
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ===== DATABASE UTILITIES =====

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Prisma database connection successful');
    return { success: true, message: 'Database connected via Prisma' };
  } catch (error) {
    console.error('❌ Prisma database connection failed:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Graceful shutdown - disconnect Prisma
 */
export async function disconnect() {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected from database');
}

/**
 * Handle process termination
 */
process.on('beforeExit', async () => {
  await disconnect();
});

export default prisma;
