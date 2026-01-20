import { createConnection } from './Backend-Web/config/database.js';

async function setupDocumentTypes() {
  const conn = await createConnection();
  
  try {
    console.log('🔄 Setting up document types system...\n');
    
    // Step 1: Drop and recreate document_types table
    await conn.query('DROP TABLE IF EXISTS document_types');
    console.log('✅ Dropped old document_types table');
    
    await conn.query(`
      CREATE TABLE document_types (
        document_type_id INT(11) NOT NULL AUTO_INCREMENT,
        type_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL,
        category VARCHAR(50) DEFAULT 'General',
        is_system_default TINYINT(1) DEFAULT 0 COMMENT 'System defaults cannot be deleted',
        display_order INT DEFAULT 0,
        status ENUM('Active','Inactive') DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (document_type_id),
        KEY idx_status (status),
        KEY idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created new document_types table');
    
    // Step 2: Insert standard document types
    await conn.query(`
      INSERT INTO document_types (type_name, description, category, is_system_default, display_order, status) VALUES
      ('Barangay Clearance', 'Clearance from local barangay', 'Legal', 1, 1, 'Active'),
      ('Business Permit', 'DTI registration or business permit', 'Business', 1, 2, 'Active'),
      ('Contract', 'Signed stall rental contract', 'Legal', 1, 3, 'Active'),
      ('Health Certificate', 'Health certificate from local health office', 'Health & Safety', 1, 4, 'Active'),
      ('Photo', 'Recent 2x2 ID photo', 'Identification', 1, 5, 'Active'),
      ('Police Clearance', 'NBI or Police clearance', 'Legal', 1, 6, 'Active'),
      ('Proof of Address', 'Utility bill or lease agreement', 'Identification', 1, 7, 'Active'),
      ('Tax Clearance', 'BIR tax clearance certificate', 'Financial', 1, 8, 'Active'),
      ('Fire Safety Certificate', 'Fire safety inspection certificate', 'Health & Safety', 1, 9, 'Active'),
      ('Sanitary Permit', 'Sanitary permit from local health office', 'Health & Safety', 1, 10, 'Active'),
      ('Valid ID', 'Government-issued ID (passport, driver\\'s license, etc.)', 'Identification', 1, 11, 'Active'),
      ('Proof of Income', 'Latest payslip or income tax return', 'Financial', 1, 12, 'Active'),
      ('Bank Statement', 'Latest bank statement (last 3 months)', 'Financial', 1, 13, 'Active'),
      ('Certificate of Registration', 'SEC/DTI certificate of registration', 'Business', 1, 14, 'Active'),
      ('Mayor\\'s Permit', 'Business permit from city/municipal office', 'Business', 1, 15, 'Active')
    `);
    console.log('✅ Inserted 15 standard document types\n');
    
    // Step 3: Backup old requirements
    await conn.query('CREATE TABLE IF NOT EXISTS branch_document_requirements_backup AS SELECT * FROM branch_document_requirements');
    console.log('✅ Backed up existing requirements');
    
    // Step 4: Drop and recreate branch_document_requirements
    await conn.query('DROP TABLE IF EXISTS branch_document_requirements');
    console.log('✅ Dropped old branch_document_requirements table');
    
    await conn.query(`
      CREATE TABLE branch_document_requirements (
        requirement_id INT(11) NOT NULL AUTO_INCREMENT,
        branch_id INT(11) NOT NULL,
        document_type_id INT(11) NOT NULL,
        is_required TINYINT(1) NOT NULL DEFAULT 1,
        instructions TEXT DEFAULT NULL COMMENT 'Special instructions for this document requirement',
        created_by_business_manager INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (requirement_id),
        KEY idx_branch_id (branch_id),
        KEY idx_document_type (document_type_id),
        UNIQUE KEY unique_branch_document (branch_id, document_type_id),
        CONSTRAINT fk_branch_doc_req_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
        CONSTRAINT fk_branch_doc_req_type FOREIGN KEY (document_type_id) REFERENCES document_types(document_type_id) ON DELETE CASCADE,
        CONSTRAINT fk_branch_doc_req_creator FOREIGN KEY (created_by_business_manager) REFERENCES business_manager(business_manager_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created new branch_document_requirements table\n');
    
    // Step 5: Show results
    const [types] = await conn.query('SELECT COUNT(*) as count FROM document_types');
    console.log(`📊 Total document types: ${types[0].count}`);
    
    console.log('\n🎉 Document types system setup complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await conn.end();
  }
}

setupDocumentTypes();
