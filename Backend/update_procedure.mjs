import { createConnection } from './Backend-Web/config/database.js';

async function updateProcedure() {
  const conn = await createConnection();
  
  try {
    // Drop old procedure
    await conn.query('DROP PROCEDURE IF EXISTS getBranchDocumentRequirements');
    console.log('✅ Dropped old procedure');
    
    // Create new procedure
    const createProc = `CREATE PROCEDURE getBranchDocumentRequirements(IN p_branch_id INT)
    BEGIN
        SELECT 
            bdr.requirement_id,
            bdr.branch_id,
            bdr.document_type_id,
            dt.type_name,
            dt.description,
            dt.category,
            bdr.is_required,
            bdr.instructions,
            bdr.created_by_business_manager,
            bdr.created_at,
            bdr.updated_at
        FROM branch_document_requirements bdr
        INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
        WHERE bdr.branch_id = p_branch_id AND dt.status = 'Active'
        ORDER BY dt.display_order, dt.type_name;
    END`;
    
    await conn.query(createProc);
    console.log('✅ Created new procedure');
    console.log('🎉 Stored procedure updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
}

updateProcedure();
