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

  // Check document tables
  const [tables] = await conn.execute("SHOW TABLES LIKE '%document%'");
  console.log('Document tables:', tables.map(t => Object.values(t)[0]));

  // Check if document_type exists
  try {
    const [cols] = await conn.execute('DESCRIBE document_type');
    console.log('\ndocument_type columns:', cols.map(c => c.Field));
  } catch (e) {
    console.log('\nNo document_type table');
  }

  // Check branch_document_requirements
  try {
    const [cols] = await conn.execute('DESCRIBE branch_document_requirements');
    console.log('\nbranch_document_requirements columns:', cols.map(c => c.Field));
  } catch (e) {
    console.log('\nNo branch_document_requirements table');
  }

  await conn.end();
})();
