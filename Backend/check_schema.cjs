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
    // Check applicant table structure
    const [applicantCols] = await conn.query('SHOW COLUMNS FROM applicant');
    console.log('applicant columns:');
    applicantCols.forEach(c => console.log(' -', c.Field));
    
    // Check if there are any users
    const [creds] = await conn.query('SELECT * FROM credential LIMIT 3');
    console.log('\nCredential records:');
    console.log(creds);
    
    // Check other_information
    const [otherCols] = await conn.query('SHOW COLUMNS FROM other_information');
    console.log('\nother_information columns:');
    otherCols.forEach(c => console.log(' -', c.Field));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
})();
