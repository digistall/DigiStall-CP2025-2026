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
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Set charset for MySQL 8 compatibility
  charset: 'utf8mb4',
  // SSL required for DigitalOcean
  ...(isCloudDB && {
    ssl: { rejectUnauthorized: false }
  })
}

console.log('🔧 Mobile App Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  passwordSet: !!dbConfig.password,
  ssl: isCloudDB ? 'enabled' : 'disabled'
})

export async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig)
    // Set session timezone to Philippine time (UTC+8)
    await connection.execute("SET time_zone = '+08:00'")
    return connection
  } catch (error) {
    console.error('❌ Mobile App Database connection failed:', error)
    throw error
  }
}

export async function testConnection() {
  let connection
  try {
    connection = await createConnection()
    await connection.execute('SELECT 1')
    return {
      success: true,
      message: 'Mobile App Database connection successful',
      config: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
      },
    }
  } catch (error) {
    console.error('Mobile App Database test failed:', error)
    return {
      success: false,
      message: 'Mobile App Database connection failed',
      error: error.message,
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

export default dbConfig