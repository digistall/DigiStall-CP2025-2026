import mysql from 'mysql2/promise'
import process from 'process'
import dotenv from 'dotenv'
dotenv.config()

// Check if using DigitalOcean (cloud) database
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
  // Set timezone to Philippine time (UTC+8)
  timezone: '+08:00',
  // SSL is required for DigitalOcean managed databases
  ...(isCloudDB && {
    ssl: {
      rejectUnauthorized: false
    }
  })
}

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  passwordSet: !!dbConfig.password,
  ssl: isCloudDB ? 'enabled' : 'disabled'
})

export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig)
    // Set session timezone to Philippine time (UTC+8)
    await connection.execute("SET time_zone = '+08:00'")
    return connection
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    throw error
  }
}

export const initializeDatabase = async () => {
  let connection;
  try {
    connection = await createConnection();
    
    // Create branch_document_requirements table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS branch_document_requirements (
        document_requirement_id int(11) NOT NULL AUTO_INCREMENT,
        branch_id int(11) NOT NULL,
        document_name varchar(255) NOT NULL,
        description text,
        is_required tinyint(1) NOT NULL DEFAULT 1,
        created_by int(11) NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (document_requirement_id),
        KEY idx_branch_id (branch_id),
        KEY idx_created_by (created_by),
        UNIQUE KEY unique_branch_document (branch_id, document_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

export const createPool = () => {
  try {
    const pool = mysql.createPool({
      ...dbConfig,
      // Set timezone for all connections in the pool
      timezone: '+08:00'
    })
    
    // Set session timezone for each connection when acquired from pool
    pool.on('acquire', async (connection) => {
      try {
        await connection.execute("SET time_zone = '+08:00'")
      } catch (err) {
        console.error('⚠️ Failed to set timezone on connection:', err.message)
      }
    })
    
    console.log('✅ Database pool created successfully (timezone: Asia/Manila +08:00)')
    return pool
  } catch (error) {
    console.error('❌ Database pool creation failed:', error.message)
    throw error
  }
}

export default {
  createConnection,
  createPool,
}