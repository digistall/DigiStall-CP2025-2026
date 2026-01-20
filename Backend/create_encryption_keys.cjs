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
    // Create encryption_keys table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS encryption_keys (
        id INT PRIMARY KEY AUTO_INCREMENT,
        key_name VARCHAR(100) NOT NULL UNIQUE,
        key_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created encryption_keys table');
    
    // Insert master key
    await conn.query(`
      INSERT IGNORE INTO encryption_keys (key_name, key_value) 
      VALUES ('master_key', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
    `);
    console.log('✅ Inserted master encryption key');
    
    // Verify
    const [rows] = await conn.query('SELECT * FROM encryption_keys');
    console.log('Encryption keys:', rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
})();
