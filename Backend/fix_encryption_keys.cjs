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
    // Add user_data_key
    await conn.query(`
      INSERT INTO encryption_keys (key_name, encryption_key, is_active) 
      VALUES ('user_data_key', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 1) 
      ON DUPLICATE KEY UPDATE encryption_key = VALUES(encryption_key), is_active = 1
    `);
    console.log('✅ Added user_data_key');
    
    // List all keys
    const [rows] = await conn.query('SELECT * FROM encryption_keys');
    console.log('All encryption keys:');
    rows.forEach(r => console.log(' -', r.key_name, '| active:', r.is_active));
    
    // Check if user exists in credential table
    const [users] = await conn.query("SELECT registrationid, user_name, applicant_id, is_active FROM credential WHERE user_name LIKE '%laurente%'");
    console.log('\nCredential users matching laurente:');
    console.log(users);
    
    // Check applicant table for email
    const [applicants] = await conn.query("SELECT applicant_id, applicant_full_name FROM applicant LIMIT 5");
    console.log('\nFirst 5 applicants:');
    console.log(applicants);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
})();
