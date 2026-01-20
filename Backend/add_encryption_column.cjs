const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

(async () => {
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    // Check which tables need the encryption_key column
    const tablesToUpdate = ['inspector', 'collector', 'stallholder', 'business_employee'];
    
    for (const table of tablesToUpdate) {
      try {
        // Check if column exists
        const [columns] = await conn.query(`SHOW COLUMNS FROM ${table} LIKE 'encryption_key'`);
        
        if (columns.length === 0) {
          // Add the column
          await conn.query(`ALTER TABLE ${table} ADD COLUMN encryption_key VARCHAR(255) DEFAULT NULL`);
          console.log(`✅ Added encryption_key column to ${table}`);
        } else {
          console.log(`ℹ️ encryption_key column already exists in ${table}`);
        }
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⚠️ Table ${table} does not exist, skipping`);
        } else {
          console.error(`❌ Error updating ${table}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ All tables updated successfully');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
})();
