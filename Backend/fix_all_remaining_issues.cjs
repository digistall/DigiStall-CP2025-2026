const mysql = require('mysql2/promise');

async function fixAllRemainingIssues() {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 FIXING ALL REMAINING MOBILE ISSUES\n');

    // 1. Fix sp_getCredentialWithApplicant to return applicant info
    console.log('1️⃣ Fixing sp_getCredentialWithApplicant (add applicant name)...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant');
    await conn.query(`
      CREATE PROCEDURE sp_getCredentialWithApplicant(IN p_username VARCHAR(255))
      BEGIN
        SELECT 
          c.credential_id,
          c.applicant_id,
          c.username,
          c.password_hash,
          c.refresh_token_hash,
          c.last_login,
          a.first_name,
          a.last_name,
          a.contact_number as applicant_contact_number,
          a.address as applicant_address,
          a.birthdate as applicant_birthdate,
          a.civil_status as applicant_civil_status,
          a.educational_attainment as applicant_educational_attainment,
          a.created_date,
          r.registrationid
        FROM credential c
        LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
        LEFT JOIN registration r ON a.registration_id = r.registrationid
        WHERE c.username = p_username;
      END
    `);
    console.log('✅ Done');

    // 2. Fix sp_getStallImagesWithData - use image_id not id
    console.log('2️⃣ Fixing sp_getStallImagesWithData (use image_id)...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallImagesWithData');
    await conn.query(`
      CREATE PROCEDURE sp_getStallImagesWithData(IN p_stall_id INT, IN p_limit INT)
      BEGIN
        SELECT 
          si.image_id,
          si.stall_id,
          si.image_data,
          si.image_type,
          si.file_name,
          si.file_size,
          si.is_primary,
          si.uploaded_at
        FROM stall_images si
        WHERE si.stall_id = p_stall_id
        ORDER BY si.is_primary DESC, si.uploaded_at DESC
        LIMIT p_limit;
      END
    `);
    console.log('✅ Done');

    // 3. Fix sp_getBranchDocRequirementsFull
    console.log('3️⃣ Fixing sp_getBranchDocRequirementsFull...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getBranchDocRequirementsFull');
    
    // First check the actual column names in branch_doc_requirements table
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'branch_doc_requirements'
    `);
    console.log('   Branch doc requirements columns:', columns.map(c => c.COLUMN_NAME).join(', '));
    
    await conn.query(`
      CREATE PROCEDURE sp_getBranchDocRequirementsFull(IN p_branch_id INT)
      BEGIN
        SELECT 
          bdr.branch_doc_req_id as requirement_id,
          bdr.branch_id,
          bdr.doc_type_id,
          bdr.is_required,
          dt.doc_type_name,
          dt.description as doc_description
        FROM branch_doc_requirements bdr
        LEFT JOIN doc_type dt ON bdr.doc_type_id = dt.doc_type_id
        WHERE bdr.branch_id = p_branch_id;
      END
    `);
    console.log('✅ Done');

    // 4. Fix sp_getStallsByTypeForApplicant to exclude occupied stalls
    console.log('4️⃣ Fixing sp_getStallsByTypeForApplicant (exclude occupied)...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallsByTypeForApplicant');
    await conn.query(`
      CREATE PROCEDURE sp_getStallsByTypeForApplicant(
        IN p_applicant_id INT,
        IN p_price_type VARCHAR(50),
        IN p_area_list TEXT
      )
      BEGIN
        SELECT 
          s.stall_id,
          s.stall_number as stall_no,
          s.stall_location,
          s.size,
          s.rental_price,
          s.price_type,
          s.description,
          s.stall_image,
          CASE 
            WHEN s.stall_status = 'Occupied' THEN 'occupied'
            WHEN EXISTS (
              SELECT 1 FROM application app 
              WHERE app.stall_id = s.stall_id 
              AND app.applicant_id = p_applicant_id 
              AND app.application_status IN ('Pending', 'Under Review', 'Approved')
            ) THEN 'applied'
            ELSE 'available'
          END as application_status,
          b.branch_id,
          b.branch_name,
          b.area,
          b.location,
          f.floor_name,
          sec.section_name
        FROM stall s
        LEFT JOIN branch b ON s.branch_id = b.branch_id
        LEFT JOIN floor f ON s.floor_id = f.floor_id
        LEFT JOIN section sec ON s.section_id = sec.section_id
        WHERE s.price_type = p_price_type
        AND s.stall_status != 'Occupied'
        AND b.status = 'Active'
        ORDER BY s.stall_number;
      END
    `);
    console.log('✅ Done');

    // 5. Fix getAvailableStallsByApplicant to exclude occupied stalls
    console.log('5️⃣ Fixing getAvailableStallsByApplicant (exclude occupied)...');
    await conn.query('DROP PROCEDURE IF EXISTS getAvailableStallsByApplicant');
    await conn.query(`
      CREATE PROCEDURE getAvailableStallsByApplicant(IN p_applicant_id INT)
      BEGIN
        SELECT 
          s.stall_id,
          s.stall_number,
          s.stall_location,
          s.size,
          s.rental_price,
          s.price_type,
          s.stall_status,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM application app 
              WHERE app.stall_id = s.stall_id 
              AND app.applicant_id = p_applicant_id 
              AND app.application_status IN ('Pending', 'Under Review')
            ) THEN 'applied'
            ELSE 'available'
          END as application_status,
          b.branch_id,
          b.branch_name,
          b.area
        FROM stall s
        LEFT JOIN branch b ON s.branch_id = b.branch_id
        WHERE s.stall_status = 'Available'
        AND b.status = 'Active'
        ORDER BY b.branch_name, s.stall_number;
      END
    `);
    console.log('✅ Done');

    // 6. Fix sp_getFullStallholderInfo to return individual name fields
    console.log('6️⃣ Fixing sp_getFullStallholderInfo (individual name fields)...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getFullStallholderInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getFullStallholderInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          sh.stallholder_id,
          sh.first_name,
          sh.last_name,
          sh.contact_number as stallholder_contact,
          sh.email as stallholder_email,
          sh.address as stallholder_address,
          sh.branch_id,
          b.branch_name,
          sh.stall_id,
          s.stall_number,
          s.stall_location,
          s.size,
          sh.contract_start_date,
          sh.contract_status,
          s.rental_price as monthly_rent,
          sh.payment_status
        FROM stallholder sh
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        WHERE sh.mobile_user_id = p_applicant_id;
      END
    `);
    console.log('✅ Done');

    // 7. Fix sp_getStallholderStallsForDocuments
    console.log('7️⃣ Fixing sp_getStallholderStallsForDocuments...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallholderStallsForDocuments');
    await conn.query(`
      CREATE PROCEDURE sp_getStallholderStallsForDocuments(IN p_applicant_id INT)
      BEGIN
        SELECT 
          sh.stallholder_id,
          sh.first_name,
          sh.last_name,
          sh.email as stallholder_email,
          sh.contact_number as stallholder_contact,
          sh.address as stallholder_address,
          sh.branch_id,
          sh.stall_id,
          sh.payment_status,
          sh.contract_status,
          sh.contract_start_date,
          s.stall_number,
          s.size,
          s.rental_price as monthly_rent,
          s.stall_location,
          s.price_type as stall_type,
          b.branch_name,
          b.area as branch_area
        FROM stallholder sh
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.mobile_user_id = p_applicant_id;
      END
    `);
    console.log('✅ Done');

    console.log('\n✅ ALL REMAINING ISSUES FIXED!');
    console.log('\n📋 Summary of fixes:');
    console.log('   1. sp_getCredentialWithApplicant - Returns first_name, last_name');
    console.log('   2. sp_getStallImagesWithData - Uses image_id instead of id');
    console.log('   3. sp_getBranchDocRequirementsFull - Uses branch_doc_req_id');
    console.log('   4. sp_getStallsByTypeForApplicant - Excludes occupied stalls');
    console.log('   5. getAvailableStallsByApplicant - Excludes occupied stalls');
    console.log('   6. sp_getFullStallholderInfo - Returns individual name fields');
    console.log('   7. sp_getStallholderStallsForDocuments - Uses correct columns');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixAllRemainingIssues();
