const mysql = require('mysql2/promise');

async function testQuery() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall'
  });
  
  try {
    console.log('Testing branch document requirements query for branch_id = 1...');
    const [result] = await connection.execute(`
      SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        dt.document_type_id,
        dt.document_name,
        dt.description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_by_manager,
        bdr.created_at,
        bdr.updated_at,
        CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
      FROM branch_document_requirements bdr
      INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
      LEFT JOIN branch_manager bm ON bdr.created_by_manager = bm.branch_manager_id
      WHERE bdr.branch_id = ?
      ORDER BY dt.document_name ASC
    `, [1]);
    
    console.log('Query result:');
    console.log(JSON.stringify(result, null, 2));
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

testQuery();