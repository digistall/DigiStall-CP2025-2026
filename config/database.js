import mysql from 'mysql2/promise'
import process from 'process'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env from project root (one level up from config/)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Check if using cloud database
const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',

  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Timeout settings (critical for cloud databases)
  connectTimeout: 30000,      // 30 seconds for initial connection
  // Note: acquireTimeout removed - only valid for connection pools

  // Keep-alive settings for persistent connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,  // 30 seconds

  // Set charset for MySQL 8 compatibility
  charset: 'utf8mb4',

  // SSL required for DigitalOcean
  ...(isCloudDB && {
    ssl: { rejectUnauthorized: false }
  })
}

// Separate config for connection pool with acquireTimeout
const poolConfig = {
  ...dbConfig,
  acquireTimeout: 30000  // 30 seconds to acquire from pool - only valid for pools
}

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  passwordSet: !!dbConfig.password,
  ssl: isCloudDB ? 'enabled' : 'disabled',
  connectTimeout: dbConfig.connectTimeout,
  connectionLimit: dbConfig.connectionLimit
})

// Connection pool singleton
let pool = null

/**
 * Get or create the connection pool
 * Uses singleton pattern to reuse connections
 */
export function getPool() {
  if (!pool) {
    pool = mysql.createPool(poolConfig)

    console.log('🔧 Database Pool Created:', {
      host: poolConfig.host,
      database: poolConfig.database,
      connectionLimit: poolConfig.connectionLimit,
      ssl: isCloudDB ? 'enabled' : 'disabled'
    })
  }
  return pool
}

/**
 * Get a connection from the pool
 * Remember to call connection.release() when done
 */
export async function getConnection() {
  try {
    const dbPool = getPool()
    const connection = await dbPool.getConnection()
    // Set session timezone to Philippine time (UTC+8)
    await connection.execute("SET time_zone = '+08:00'")
    return connection
  } catch (error) {
    console.error('❌ Database connection failed:', error.code || error.message)
    throw error
  }
}

/**
 * Create a single connection (for backward compatibility)
 * @deprecated Use getConnection() instead for better connection reuse
 */
export async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig)
    // Set session timezone to Philippine time (UTC+8)
    await connection.execute("SET time_zone = '+08:00'")
    return connection
  } catch (error) {
    console.error('❌ Database connection failed:', error.code || error.message)
    throw error
  }
}

/**
 * Test the database connection
 */
export async function testConnection() {
  try {
    const dbPool = getPool()
    const connection = await dbPool.getConnection()
    await connection.execute('SELECT 1')
    connection.release()

    return {
      success: true,
      message: 'Database connection successful',
      config: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        poolSize: dbConfig.connectionLimit
      },
    }
  } catch (error) {
    console.error('Database test failed:', error)
    return {
      success: false,
      message: 'Database connection failed',
      error: error.message,
    }
  }
}

export default dbConfig

