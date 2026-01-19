import { createConnection } from './Backend-Web/config/database.js';
import fs from 'fs';

async function fixMobileDocumentProcedures() {
  const conn = await createConnection();
  
  try {
    console.log('🔄 Fixing mobile document stored procedures...\n');
    
    // Step 1: Fix stallholder_documents table structure
    console.log('📋 Step 1: Checking stallholder_documents table structure...');
    
    // Check if document_type_id column exists
    const [columns] = await conn.query("SHOW COLUMNS FROM stallholder_documents LIKE 'document_type_id'");
    
    if (columns.length === 0) {
      console.log('⚠️  Adding document_type_id column to stallholder_documents table...');
      
      // Add new column
      await conn.query(`
        ALTER TABLE stallholder_documents 
        ADD COLUMN document_type_id INT(11) DEFAULT NULL AFTER stallholder_id,
        ADD KEY idx_document_type (document_type_id)
      `);
      console.log('✅ Added document_type_id column');
      
      // Try to migrate existing data based on document_type string
      await conn.query(`
        UPDATE stallholder_documents sd
        INNER JOIN document_types dt ON sd.document_type = dt.type_name
        SET sd.document_type_id = dt.document_type_id
        WHERE sd.document_type_id IS NULL
      `);
      console.log('✅ Migrated existing document data');
    } else {
      console.log('✅ document_type_id column already exists');
    }
    
    // Step 2: Drop old procedures
    await conn.query('DROP PROCEDURE IF EXISTS sp_getBranchDocRequirementsFull');
    console.log('\n✅ Dropped old sp_getBranchDocRequirementsFull');
    
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallholderUploadedDocuments');
    console.log('✅ Dropped old sp_getStallholderUploadedDocuments');
    
    // Step 3: Create new sp_getBranchDocRequirementsFull
    const createProcRequirements = `CREATE PROCEDURE sp_getBranchDocRequirementsFull(
      IN p_branch_id INT
    )
    BEGIN
        SELECT 
            bdr.requirement_id,
            bdr.branch_id,
            bdr.document_type_id,
            bdr.is_required,
            bdr.instructions,
            dt.type_name as document_name,
            dt.description as document_description,
            dt.category,
            dt.display_order
        FROM branch_document_requirements bdr
        INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
        WHERE bdr.branch_id = p_branch_id AND dt.status = 'Active'
        ORDER BY bdr.is_required DESC, dt.display_order ASC, dt.type_name ASC;
    END`;
    
    await conn.query(createProcRequirements);
    console.log('\n✅ Created new sp_getBranchDocRequirementsFull');
    
    // Step 4: Create new sp_getStallholderUploadedDocuments
    const createProcUploaded = `CREATE PROCEDURE sp_getStallholderUploadedDocuments(
      IN p_stallholder_ids TEXT
    )
    BEGIN
        SET @sql = CONCAT('
            SELECT 
                sd.document_id,
                sd.stallholder_id,
                sd.document_type_id,
                sd.document_type,
                sd.document_name as original_filename,
                sd.document_mime_type as mime_type,
                LENGTH(sd.document_data) as file_size,
                sd.verification_status,
                sd.verified_at,
                sd.remarks as rejection_reason,
                sd.created_at as upload_date,
                NULL as expiry_date,
                NULL as days_until_expiry,
                NULL as file_path
            FROM stallholder_documents sd
            WHERE sd.stallholder_id IN (', p_stallholder_ids, ')
            ORDER BY sd.created_at DESC
        ');
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END`;
    
    await conn.query(createProcUploaded);
    console.log('✅ Created new sp_getStallholderUploadedDocuments');
    
    console.log('\n🎉 Mobile document procedures fixed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await conn.end();
  }
}

fixMobileDocumentProcedures();
