import { createConnection } from './config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('All Tables:', tables.map(t => Object.values(t)[0]));

    const vendorTables = tables
      .map(t => Object.values(t)[0])
      .filter(name => name.toLowerCase().includes('vendor'));
      
    console.log('Vendor tables:', vendorTables);

    for (const table of vendorTables) {
      const [columns] = await connection.execute(`DESCRIBE ${table}`);
      console.log(`\nColumns in ${table}:`, columns.map(c => ({ Field: c.Field, Type: c.Type })));
    }
  } catch (err) {
    console.error('Failed to describe table:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
