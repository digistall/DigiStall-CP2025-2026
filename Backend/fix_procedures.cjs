const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    // 1. Fix sp_insertApplicantDocumentMulter to match actual table schema
    console.log('Fixing sp_insertApplicantDocumentMulter...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_insertApplicantDocumentMulter');
    await conn.query(`
      CREATE PROCEDURE sp_insertApplicantDocumentMulter(
        IN p_applicant_id INT,
        IN p_business_owner_id INT,
        IN p_branch_id INT,
        IN p_document_type_id INT,
        IN p_file_path VARCHAR(500),
        IN p_filename VARCHAR(255),
        IN p_file_size INT,
        IN p_mime_type VARCHAR(100),
        IN p_document_data LONGBLOB
      )
      BEGIN
        DECLARE doc_type_name VARCHAR(100);
        
        CASE p_document_type_id
          WHEN 1 THEN SET doc_type_name = 'signature';
          WHEN 2 THEN SET doc_type_name = 'house_location';
          WHEN 3 THEN SET doc_type_name = 'valid_id';
          ELSE SET doc_type_name = 'document';
        END CASE;
        
        INSERT INTO applicant_documents (
          applicant_id, document_type, document_name, document_data,
          document_mime_type, file_path, verification_status, created_at
        ) VALUES (
          p_applicant_id, doc_type_name, p_filename, p_document_data,
          p_mime_type, p_file_path, 'Pending', NOW()
        );
        SELECT LAST_INSERT_ID() as document_id;
      END
    `);
    console.log('✅ Fixed sp_insertApplicantDocumentMulter');

    // 2. Fix sp_checkExistingApplicantDocumentMulter
    console.log('Fixing sp_checkExistingApplicantDocumentMulter...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_checkExistingApplicantDocumentMulter');
    await conn.query(`
      CREATE PROCEDURE sp_checkExistingApplicantDocumentMulter(
        IN p_applicant_id INT,
        IN p_business_owner_id INT,
        IN p_document_type_id INT
      )
      BEGIN
        DECLARE doc_type_name VARCHAR(100);
        
        CASE p_document_type_id
          WHEN 1 THEN SET doc_type_name = 'signature';
          WHEN 2 THEN SET doc_type_name = 'house_location';
          WHEN 3 THEN SET doc_type_name = 'valid_id';
          ELSE SET doc_type_name = 'document';
        END CASE;
        
        SELECT document_id FROM applicant_documents 
        WHERE applicant_id = p_applicant_id AND document_type = doc_type_name;
      END
    `);
    console.log('✅ Fixed sp_checkExistingApplicantDocumentMulter');

    // 3. Fix sp_updateApplicantDocumentMulter
    console.log('Fixing sp_updateApplicantDocumentMulter...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_updateApplicantDocumentMulter');
    await conn.query(`
      CREATE PROCEDURE sp_updateApplicantDocumentMulter(
        IN p_document_id INT,
        IN p_file_path VARCHAR(500),
        IN p_filename VARCHAR(255),
        IN p_file_size INT,
        IN p_mime_type VARCHAR(100),
        IN p_document_data LONGBLOB
      )
      BEGIN
        UPDATE applicant_documents 
        SET document_name = p_filename,
            document_data = p_document_data,
            document_mime_type = p_mime_type,
            file_path = p_file_path,
            updated_at = NOW()
        WHERE document_id = p_document_id;
        SELECT p_document_id as document_id;
      END
    `);
    console.log('✅ Fixed sp_updateApplicantDocumentMulter');

    // 4. Create setBranchDocumentRequirement stored procedure
    console.log('Creating setBranchDocumentRequirement stored procedure...');
    await conn.query('DROP PROCEDURE IF EXISTS setBranchDocumentRequirement');
    await conn.query(`
      CREATE PROCEDURE setBranchDocumentRequirement(
        IN p_branch_id INT,
        IN p_document_name VARCHAR(255),
        IN p_description TEXT,
        IN p_is_required TINYINT,
        IN p_created_by INT
      )
      BEGIN
        INSERT INTO branch_document_requirements (
          branch_id, document_name, description, is_required, created_by, created_at, updated_at
        ) VALUES (
          p_branch_id, p_document_name, p_description, p_is_required, p_created_by, NOW(), NOW()
        );
        SELECT LAST_INSERT_ID() as requirement_id;
      END
    `);
    console.log('✅ Created setBranchDocumentRequirement');

    // 5. Fix sp_getOnsitePaymentsByBranchesDecrypted - use first_name/last_name instead of stallholder_name
    console.log('Fixing sp_getOnsitePaymentsByBranchesDecrypted...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsByBranchesDecrypted');
    await conn.query(`
      CREATE PROCEDURE sp_getOnsitePaymentsByBranchesDecrypted(
        IN p_branch_ids TEXT,
        IN p_staff_id INT,
        IN p_limit INT,
        IN p_offset INT
      )
      BEGIN
        SELECT 
          p.payment_id,
          p.stallholder_id,
          CONCAT(sh.first_name, ' ', sh.last_name) as stallholder_name,
          sh.first_name,
          sh.last_name,
          sh.email,
          sh.contact_number,
          p.amount,
          p.payment_date,
          p.payment_method,
          p.reference_number,
          p.status as payment_status,
          s.stall_no,
          s.stall_id,
          b.branch_name,
          b.branch_id
        FROM payments p
        JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        JOIN stall s ON sh.stall_id = s.stall_id
        JOIN section sec ON s.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        WHERE p.payment_method = 'cash'
          AND (p_branch_ids IS NULL OR p_branch_ids = '' OR FIND_IN_SET(b.branch_id, p_branch_ids) > 0)
        ORDER BY p.payment_date DESC
        LIMIT p_limit OFFSET p_offset;
      END
    `);
    console.log('✅ Fixed sp_getOnsitePaymentsByBranchesDecrypted');

    // 6. Fix sp_getOnlinePaymentsByBranchesDecrypted
    console.log('Fixing sp_getOnlinePaymentsByBranchesDecrypted...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsByBranchesDecrypted');
    await conn.query(`
      CREATE PROCEDURE sp_getOnlinePaymentsByBranchesDecrypted(
        IN p_branch_ids TEXT,
        IN p_staff_id INT,
        IN p_limit INT,
        IN p_offset INT
      )
      BEGIN
        SELECT 
          p.payment_id,
          p.stallholder_id,
          CONCAT(sh.first_name, ' ', sh.last_name) as stallholder_name,
          sh.first_name,
          sh.last_name,
          sh.email,
          sh.contact_number,
          p.amount,
          p.payment_date,
          p.payment_method,
          p.reference_number,
          p.status as payment_status,
          s.stall_no,
          s.stall_id,
          b.branch_name,
          b.branch_id
        FROM payments p
        JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        JOIN stall s ON sh.stall_id = s.stall_id
        JOIN section sec ON s.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        WHERE p.payment_method != 'cash'
          AND (p_branch_ids IS NULL OR p_branch_ids = '' OR FIND_IN_SET(b.branch_id, p_branch_ids) > 0)
        ORDER BY p.payment_date DESC
        LIMIT p_limit OFFSET p_offset;
      END
    `);
    console.log('✅ Fixed sp_getOnlinePaymentsByBranchesDecrypted');

    // 7. Fix sp_get_all_stallholders_decrypted
    console.log('Fixing sp_get_all_stallholders_decrypted...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_get_all_stallholders_decrypted');
    await conn.query(`
      CREATE PROCEDURE sp_get_all_stallholders_decrypted(
        IN p_branch_ids TEXT
      )
      BEGIN
        SELECT 
          sh.stallholder_id,
          CONCAT(sh.first_name, ' ', sh.last_name) as stallholder_name,
          sh.first_name,
          sh.last_name,
          sh.email,
          sh.contact_number,
          sh.address,
          sh.stall_id,
          sh.branch_id,
          sh.payment_status,
          sh.status,
          s.stall_no,
          s.rental_price,
          b.branch_name
        FROM stallholder sh
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE (p_branch_ids IS NULL OR p_branch_ids = '' OR FIND_IN_SET(sh.branch_id, p_branch_ids) > 0)
        ORDER BY sh.stallholder_id DESC;
      END
    `);
    console.log('✅ Fixed sp_get_all_stallholders_decrypted');

    console.log('\n✅ All stored procedures fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
})();
