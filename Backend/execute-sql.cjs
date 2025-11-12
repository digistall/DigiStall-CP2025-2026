const mysql = require('mysql2/promise');
const fs = require('fs');

async function executeSQLFile() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall',
    multipleStatements: true
  });
  
  try {
    const sqlContent = fs.readFileSync('fix-stallholder-procedure.sql', 'utf8');
    
    // Remove DELIMITER statements as they're not needed in Node.js
    const cleanSQL = sqlContent
      .replace(/DELIMITER \/\/\n/g, '')
      .replace(/DELIMITER ;\n/g, '')
      .replace(/\/\//g, '');
    
    await connection.query(cleanSQL);
    console.log('✅ Successfully updated the stallholder procedure');
    console.log('Now only stallholders WITH assigned stalls will be shown');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await connection.end();
  }
}

executeSQLFile();