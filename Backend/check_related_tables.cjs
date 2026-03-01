const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'naga_stall',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('🔍 CHECKING VENDOR RELATED TABLES STRUCTURE...\n');

    const tables = ['vendor_spouse', 'vendor_child', 'vendor_business', 'vendor_documents'];

    for (const table of tables) {
      console.log(`\n📋 ${table.toUpperCase()} Table Columns:`);
      const [columns] = await conn.query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          EXTRA
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [table]);

      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.COLUMN_KEY === 'PRI' ? '[PRIMARY KEY]' : ''} ${col.EXTRA}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
})();
