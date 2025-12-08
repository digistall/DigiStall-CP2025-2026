import mysql from 'mysql2/promise'
import process from 'process'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

console.log('🔧 Database Config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  passwordSet: !!dbConfig.password,
})

export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig)
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
    const pool = mysql.createPool(dbConfig)
    console.log('✅ Database pool created successfully')
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