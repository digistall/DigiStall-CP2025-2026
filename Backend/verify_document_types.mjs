import { createConnection } from './Backend-Web/config/database.js';

async function verifyDocumentTypes() {
  const conn = await createConnection();
  
  try {
    const [types] = await conn.execute(
      'SELECT document_type_id, type_name, category, description FROM document_types WHERE status = ? ORDER BY display_order',
      ['Active']
    );
    
    console.log('\n📋 Available Document Types (' + types.length + ' total):\n');
    
    types.forEach(t => {
      console.log(`  [${t.document_type_id}] ${t.type_name} (${t.category})`);
      console.log(`      ${t.description}\n`);
    });
    
    console.log('✅ Document types system is working correctly!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
}

verifyDocumentTypes();
