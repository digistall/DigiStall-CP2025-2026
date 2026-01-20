const mysql = require('mysql2/promise');

/**
 * Fix Script: Landing Page Issues
 * 1. Fix sp_getAllStallsForLanding to use stall_images table
 * 2. Fix sp_getStallsByAreaOrBranch to use stall_images table  
 * 3. Create missing createApplicantComplete procedure
 */

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

  console.log('=== Fixing Landing Page Issues ===\n');

  try {
    // =====================================================
    // FIX 1: sp_getAllStallsForLanding - Use stall_images table
    // =====================================================
    console.log('1. Fixing sp_getAllStallsForLanding to use BLOB images...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getAllStallsForLanding');
    
    await conn.query(`
      CREATE PROCEDURE sp_getAllStallsForLanding()
      BEGIN
          SELECT 
              s.stall_id as id,
              s.stall_number as stallNumber,
              s.stall_location as location,
              s.size as dimensions,
              s.rental_price,
              s.price_type,
              s.status,
              s.description,
              -- Use primary image from stall_images table
              si.image_id as stall_image_id,
              CASE 
                WHEN si.image_id IS NOT NULL THEN CONCAT('/api/stalls/images/blob/id/', si.image_id)
                ELSE NULL
              END as imageUrl,
              s.is_available as isAvailable,
              sec.section_name as section,
              f.floor_name as floor,
              f.floor_number,
              b.area,
              b.location as branchLocation,
              b.branch_name as branch,
              bm.first_name as manager_first_name,
              bm.last_name as manager_last_name
          FROM stall s
          INNER JOIN section sec ON s.section_id = sec.section_id
          INNER JOIN floor f ON sec.floor_id = f.floor_id
          INNER JOIN branch b ON f.branch_id = b.branch_id
          LEFT JOIN branch_manager bm ON b.business_manager_id = bm.branch_manager_id
          LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
          WHERE s.is_available = 1
          ORDER BY s.created_at DESC;
      END
    `);
    console.log('   ✅ sp_getAllStallsForLanding fixed\n');

    // =====================================================
    // FIX 2: sp_getStallsByAreaOrBranch - Use stall_images table
    // =====================================================
    console.log('2. Fixing sp_getStallsByAreaOrBranch to use BLOB images...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallsByAreaOrBranch');
    
    await conn.query(`
      CREATE PROCEDURE sp_getStallsByAreaOrBranch(
          IN p_filter_value VARCHAR(255),
          IN p_filter_by_branch BOOLEAN
      )
      BEGIN
          IF p_filter_by_branch THEN
              SELECT 
                  s.stall_id as id,
                  s.stall_number as stallNumber,
                  s.stall_location as location,
                  s.size as dimensions,
                  s.rental_price,
                  s.price_type,
                  s.status,
                  s.description,
                  -- Use primary image from stall_images table
                  si.image_id as stall_image_id,
                  CASE 
                    WHEN si.image_id IS NOT NULL THEN CONCAT('/api/stalls/images/blob/id/', si.image_id)
                    ELSE NULL
                  END as imageUrl,
                  s.is_available as isAvailable,
                  sec.section_name as section,
                  f.floor_name as floor,
                  f.floor_number,
                  b.area,
                  b.location as branchLocation,
                  b.branch_name as branch,
                  b.branch_id as branchId,
                  bm.first_name as manager_first_name,
                  bm.last_name as manager_last_name
              FROM stall s
              INNER JOIN section sec ON s.section_id = sec.section_id
              INNER JOIN floor f ON sec.floor_id = f.floor_id
              INNER JOIN branch b ON f.branch_id = b.branch_id
              LEFT JOIN branch_manager bm ON b.business_manager_id = bm.branch_manager_id
              LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
              WHERE b.branch_name = p_filter_value AND s.is_available = 1
              ORDER BY s.created_at DESC;
          ELSE
              SELECT 
                  s.stall_id as id,
                  s.stall_number as stallNumber,
                  s.stall_location as location,
                  s.size as dimensions,
                  s.rental_price,
                  s.price_type,
                  s.status,
                  s.description,
                  -- Use primary image from stall_images table
                  si.image_id as stall_image_id,
                  CASE 
                    WHEN si.image_id IS NOT NULL THEN CONCAT('/api/stalls/images/blob/id/', si.image_id)
                    ELSE NULL
                  END as imageUrl,
                  s.is_available as isAvailable,
                  sec.section_name as section,
                  f.floor_name as floor,
                  f.floor_number,
                  b.area,
                  b.location as branchLocation,
                  b.branch_name as branch,
                  b.branch_id as branchId,
                  bm.first_name as manager_first_name,
                  bm.last_name as manager_last_name
              FROM stall s
              INNER JOIN section sec ON s.section_id = sec.section_id
              INNER JOIN floor f ON sec.floor_id = f.floor_id
              INNER JOIN branch b ON f.branch_id = b.branch_id
              LEFT JOIN branch_manager bm ON b.business_manager_id = bm.branch_manager_id
              LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
              WHERE b.area = p_filter_value AND s.is_available = 1
              ORDER BY s.created_at DESC;
          END IF;
      END
    `);
    console.log('   ✅ sp_getStallsByAreaOrBranch fixed\n');

    // =====================================================
    // FIX 3: Create createApplicantComplete procedure with proper column sizes
    // =====================================================
    console.log('3. Creating createApplicantComplete procedure with proper column sizes...');
    await conn.query('DROP PROCEDURE IF EXISTS createApplicantComplete');
    
    await conn.query(`
      CREATE PROCEDURE createApplicantComplete (
          IN p_full_name VARCHAR(500), 
          IN p_contact_number VARCHAR(500), 
          IN p_address TEXT, 
          IN p_birthdate DATE, 
          IN p_civil_status ENUM('Single','Married','Divorced','Widowed'), 
          IN p_educational_attainment VARCHAR(100), 
          IN p_nature_of_business VARCHAR(255), 
          IN p_capitalization DECIMAL(15,2), 
          IN p_source_of_capital VARCHAR(255), 
          IN p_previous_business_experience TEXT, 
          IN p_relative_stall_owner ENUM('Yes','No'), 
          IN p_spouse_full_name VARCHAR(500), 
          IN p_spouse_birthdate DATE, 
          IN p_spouse_educational_attainment VARCHAR(100), 
          IN p_spouse_contact_number VARCHAR(500), 
          IN p_spouse_occupation VARCHAR(100), 
          IN p_signature_of_applicant VARCHAR(500), 
          IN p_house_sketch_location VARCHAR(500), 
          IN p_valid_id VARCHAR(500), 
          IN p_email_address VARCHAR(255)
      )
      BEGIN
          DECLARE new_applicant_id INT;
          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              SIGNAL SQLSTATE '45000' 
              SET MESSAGE_TEXT = 'Error creating applicant record';
          END;
          
          START TRANSACTION;
          
          -- Insert applicant (main table)
          INSERT INTO applicant (
              applicant_full_name, 
              applicant_contact_number, 
              applicant_address,
              applicant_birthdate, 
              applicant_civil_status, 
              applicant_educational_attainment
          ) VALUES (
              p_full_name, 
              p_contact_number, 
              NULLIF(p_address, ''),
              p_birthdate, 
              COALESCE(p_civil_status, 'Single'), 
              NULLIF(p_educational_attainment, '')
          );
          
          SET new_applicant_id = LAST_INSERT_ID();
          
          -- Insert business information
          INSERT INTO business_information (
              applicant_id, 
              nature_of_business, 
              capitalization,
              source_of_capital, 
              previous_business_experience, 
              relative_stall_owner
          ) VALUES (
              new_applicant_id, 
              NULLIF(p_nature_of_business, ''), 
              p_capitalization,
              NULLIF(p_source_of_capital, ''), 
              NULLIF(p_previous_business_experience, ''), 
              COALESCE(p_relative_stall_owner, 'No')
          );
          
          -- Insert other information
          INSERT INTO other_information (
              applicant_id, 
              signature_of_applicant, 
              house_sketch_location, 
              valid_id, 
              email_address
          ) VALUES (
              new_applicant_id, 
              NULLIF(p_signature_of_applicant, ''), 
              NULLIF(p_house_sketch_location, ''),
              NULLIF(p_valid_id, ''), 
              p_email_address
          );
          
          -- Insert spouse information only if spouse name is provided
          IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
              INSERT INTO spouse (
                  applicant_id, 
                  spouse_full_name, 
                  spouse_birthdate,
                  spouse_educational_attainment, 
                  spouse_contact_number, 
                  spouse_occupation
              ) VALUES (
                  new_applicant_id, 
                  p_spouse_full_name, 
                  p_spouse_birthdate,
                  NULLIF(p_spouse_educational_attainment, ''), 
                  NULLIF(p_spouse_contact_number, ''), 
                  NULLIF(p_spouse_occupation, '')
              );
          END IF;
          
          COMMIT;
          
          -- Return the new applicant ID
          SELECT new_applicant_id as new_applicant_id;
      END
    `);
    console.log('   ✅ createApplicantComplete procedure created\n');

    // =====================================================
    // FIX 4: sp_getLandingPageStallsList - Used by Stall Overview modal
    // =====================================================
    console.log('4. Fixing sp_getLandingPageStallsList to use BLOB images...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getLandingPageStallsList');
    
    await conn.query(`
      CREATE PROCEDURE sp_getLandingPageStallsList(
        IN p_search VARCHAR(255),
        IN p_branch_id INT,
        IN p_status VARCHAR(50),
        IN p_price_type VARCHAR(50),
        IN p_limit INT,
        IN p_offset INT
      )
      BEGIN
        DECLARE search_pattern VARCHAR(260);
        SET search_pattern = IF(p_search IS NOT NULL AND p_search != '', CONCAT('%', p_search, '%'), NULL);
        
        SELECT
          s.stall_id,
          s.stall_number,
          s.stall_location,
          s.size,
          s.rental_price,
          s.price_type,
          s.status,
          s.is_available,
          s.description,
          si.image_id as stall_image_id,
          CASE 
            WHEN si.image_id IS NOT NULL THEN CONCAT('/api/stalls/images/blob/id/', si.image_id)
            ELSE NULL
          END as stall_image,
          sec.section_name,
          f.floor_name,
          b.branch_name,
          b.branch_id,
          CASE WHEN sh.stallholder_id IS NOT NULL THEN 'Occupied' ELSE 'Available' END as occupancy_status
        FROM stall s
        LEFT JOIN section sec ON s.section_id = sec.section_id
        LEFT JOIN floor f ON s.floor_id = f.floor_id
        LEFT JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE 1=1
          AND s.is_available = 1
          AND (search_pattern IS NULL OR (
            s.stall_number COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            s.stall_location COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            sec.section_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            f.floor_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            b.branch_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci
          ))
          AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
          AND (p_status IS NULL OR p_status = '' OR
               (p_status = 'Occupied' AND sh.stallholder_id IS NOT NULL) OR
               (p_status = 'Available' AND sh.stallholder_id IS NULL) OR
               (p_status NOT IN ('Occupied', 'Available') AND s.status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci))
          AND (p_price_type IS NULL OR p_price_type = '' OR s.price_type COLLATE utf8mb4_unicode_ci = p_price_type COLLATE utf8mb4_unicode_ci)
        ORDER BY b.branch_name, f.floor_name, s.stall_number ASC
        LIMIT p_limit OFFSET p_offset;
      END
    `);
    console.log('   ✅ sp_getLandingPageStallsList fixed\n');

    // =====================================================
    // TESTING
    // =====================================================
    console.log('=== Testing Fixes ===\n');

    // Test sp_getAllStallsForLanding
    console.log('Testing sp_getAllStallsForLanding...');
    try {
      const [rows1] = await conn.execute('CALL sp_getAllStallsForLanding()');
      console.log(`   ✅ Found ${rows1[0].length} stalls`);
      if (rows1[0].length > 0) {
        const sample = rows1[0][0];
        console.log(`   📷 Sample image URL: ${sample.imageUrl}`);
        console.log(`   📷 Sample image ID: ${sample.stall_image_id}`);
      }
    } catch (e) {
      console.error('   ❌ Error:', e.message);
    }

    // Test sp_getStallsByAreaOrBranch
    console.log('\nTesting sp_getStallsByAreaOrBranch...');
    try {
      const [rows2] = await conn.execute("CALL sp_getStallsByAreaOrBranch(?, ?)", ["Naga City People's Mall", true]);
      console.log(`   ✅ Found ${rows2[0].length} stalls for branch`);
      if (rows2[0].length > 0) {
        const sample = rows2[0][0];
        console.log(`   📷 Sample image URL: ${sample.imageUrl}`);
        console.log(`   📷 Sample image ID: ${sample.stall_image_id}`);
      }
    } catch (e) {
      console.error('   ❌ Error:', e.message);
    }

    // Test sp_getLandingPageStallsList
    console.log('\nTesting sp_getLandingPageStallsList...');
    try {
      const [rows3] = await conn.execute('CALL sp_getLandingPageStallsList(?, ?, ?, ?, ?, ?)', [null, null, null, null, 20, 0]);
      console.log(`   ✅ Found ${rows3[0].length} stalls`);
      if (rows3[0].length > 0) {
        const sample = rows3[0][0];
        console.log(`   📷 Sample stall_image: ${sample.stall_image}`);
        console.log(`   📷 Sample image ID: ${sample.stall_image_id}`);
      }
    } catch (e) {
      console.error('   ❌ Error:', e.message);
    }

    // Verify createApplicantComplete exists
    console.log('\nVerifying createApplicantComplete procedure...');
    try {
      const [procs] = await conn.execute(
        "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = 'naga_stall' AND ROUTINE_NAME = 'createApplicantComplete'"
      );
      if (procs.length > 0) {
        console.log('   ✅ createApplicantComplete procedure exists');
      } else {
        console.log('   ❌ createApplicantComplete procedure NOT found');
      }
    } catch (e) {
      console.error('   ❌ Error:', e.message);
    }

    console.log('\n=== All Fixes Applied Successfully ===');

  } catch (error) {
    console.error('❌ Error during fix:', error.message);
  } finally {
    await conn.end();
  }
})();
