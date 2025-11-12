const mysql = require('mysql2/promise');

async function testCreation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall'
  });
  
  try {
    // Test creating a document requirement
    const [result] = await connection.execute(`
      INSERT INTO branch_document_requirements 
      (branch_id, document_type_id, is_required, instructions, created_by_manager) 
      VALUES (?, ?, ?, ?, ?)
    `, [1, 5, 1, 'Test instructions for Valid ID', 1]);

    console.log('✅ Successfully created document requirement:');
    console.log('Insert ID:', result.insertId);
    console.log('Branch ID: 1, Document Type ID: 5 (Valid ID)');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await connection.end();
  }
}

testCreation();