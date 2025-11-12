// Direct test of the API endpoint using the Backend's database connection
import { createConnection } from './Backend/config/database.js';

async function testDocumentAPI() {
  let connection;
  try {
    console.log('🔍 Testing document requirements query...');
    
    connection = await createConnection();
    
    const [requirements] = await connection.execute(`
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

    console.log('✅ Found requirements:', requirements.length);
    console.log('📋 Sample data:');
    console.log(JSON.stringify(requirements, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

testDocumentAPI();