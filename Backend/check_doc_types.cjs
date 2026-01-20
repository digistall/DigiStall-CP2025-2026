const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  // Check document_types structure
  try {
    const [cols] = await conn.execute('DESCRIBE document_types');
    console.log('document_types columns:', cols.map(c => ({ field: c.Field, type: c.Type })));
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Try to query it
  try {
    const [rows] = await conn.execute('SELECT * FROM document_types LIMIT 5');
    console.log('\ndocument_types data:', rows);
  } catch (e) {
    console.log('Query error:', e.message);
  }

  await conn.end();
})();
