const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'naga_stall',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true
  });

  try {
    console.log('🔧 FIXING VENDOR MODULE STORED PROCEDURES (CORRECTED SCHEMA)\n');
    console.log('========================================\n');

    // ========================================
    // 1. CREATE VENDOR WITH RELATIONS (FIXED)
    // ========================================
    console.log('1️⃣ Fixing sp_createVendorWithRelations...');
    await conn.query('DROP PROCEDURE IF EXISTS createVendorWithRelations');
    await conn.query(`
      CREATE PROCEDURE createVendorWithRelations(
        -- Vendor personal info
        IN p_first_name VARCHAR(100),
        IN p_last_name VARCHAR(100),
        IN p_middle_name VARCHAR(100),
        IN p_suffix VARCHAR(10),
        IN p_contact_number VARCHAR(100),
        IN p_email VARCHAR(100),
        IN p_birthdate DATE,
        IN p_gender VARCHAR(10),
        IN p_address TEXT,
        IN p_vendor_identifier VARCHAR(45),
        IN p_status VARCHAR(20),
        -- Spouse info (full name)
        IN p_spouse_first_name VARCHAR(45),
        IN p_spouse_middle_name VARCHAR(45),
        IN p_spouse_last_name VARCHAR(45),
        IN p_spouse_age VARCHAR(5),
        IN p_spouse_birthdate DATE,
        IN p_spouse_education VARCHAR(45),
        IN p_spouse_contact VARCHAR(20),
        IN p_spouse_occupation VARCHAR(45),
        -- Child info (no age column)
        IN p_child_first_name VARCHAR(45),
        IN p_child_middle_name VARCHAR(45),
        IN p_child_last_name VARCHAR(45),
        IN p_child_birthdate DATE,
        -- Business info
        IN p_business_name VARCHAR(100),
        IN p_business_type VARCHAR(100),
        IN p_business_description VARCHAR(255),
        IN p_vending_time_start TIME,
        IN p_vending_time_end TIME
      )
      BEGIN
        DECLARE v_vendor_id INT;
        DECLARE v_spouse_id INT DEFAULT NULL;
        DECLARE v_child_id INT DEFAULT NULL;
        DECLARE v_business_id INT DEFAULT NULL;
        
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;
        
        START TRANSACTION;
        
        -- Create vendor_spouse if spouse data provided
        IF p_spouse_first_name IS NOT NULL THEN
          INSERT INTO vendor_spouse (
            first_name, middle_name, last_name, age, birthdate, educational_attainment, 
            contact_number, occupation, created_at, updated_at
          ) VALUES (
            p_spouse_first_name, p_spouse_middle_name, p_spouse_last_name,
            p_spouse_age, p_spouse_birthdate,
            p_spouse_education, p_spouse_contact, p_spouse_occupation,
            NOW(), NOW()
          );
          SET v_spouse_id = LAST_INSERT_ID();
        END IF;
        
        -- Create vendor_child if child data provided (no age)
        IF p_child_first_name IS NOT NULL THEN
          INSERT INTO vendor_child (
            first_name, middle_name, last_name, birthdate, created_at, updated_at
          ) VALUES (
            p_child_first_name, p_child_middle_name, p_child_last_name,
            p_child_birthdate, NOW(), NOW()
          );
          SET v_child_id = LAST_INSERT_ID();
        END IF;
        
        -- Create vendor_business if business data provided
        IF p_business_name IS NOT NULL THEN
          INSERT INTO vendor_business (
            business_name, business_type, business_description,
            vending_time_start, vending_time_end, created_at, updated_at
          ) VALUES (
            p_business_name, p_business_type, p_business_description,
            p_vending_time_start, p_vending_time_end, NOW(), NOW()
          );
          SET v_business_id = LAST_INSERT_ID();
        END IF;
        
        -- Create vendor
        INSERT INTO vendor (
          first_name, last_name, middle_name, suffix,
          contact_number, email, birthdate, gender, address,
          vendor_identifier, status,
          vendor_spouse_id, vendor_child_id, vendor_business_id,
          created_at, updated_at
        ) VALUES (
          p_first_name, p_last_name, p_middle_name, p_suffix,
          p_contact_number, p_email, p_birthdate, p_gender, p_address,
          p_vendor_identifier, COALESCE(p_status, 'Active'),
          v_spouse_id, v_child_id, v_business_id,
          NOW(), NOW()
        );
        
        SET v_vendor_id = LAST_INSERT_ID();
        
        COMMIT;
        
        -- Return the created vendor ID
        SELECT v_vendor_id as vendor_id;
      END
    `);
    console.log('✅ sp_createVendorWithRelations fixed successfully\n');

    // ========================================
    // 2. GET ALL VENDORS WITH RELATIONS (FIXED)
    // ========================================
    console.log('2️⃣ Fixing sp_getAllVendorsWithRelations...');
    await conn.query('DROP PROCEDURE IF EXISTS getAllVendorsWithRelations');
    await conn.query(`
      CREATE PROCEDURE getAllVendorsWithRelations()
      BEGIN
        SELECT 
          v.vendor_id,
          v.first_name,
          v.middle_name,
          v.last_name,
          v.suffix,
          CONCAT_WS(' ', v.first_name, v.middle_name, v.last_name, v.suffix) as full_name,
          v.contact_number,
          v.email,
          v.birthdate,
          v.gender,
          v.address,
          v.civil_status,
          v.vendor_identifier,
          v.status,
          v.created_at,
          v.updated_at,
          -- Spouse details
          vs.vendor_spouse_id,
          vs.first_name as spouse_first_name,
          vs.middle_name as spouse_middle_name,
          vs.last_name as spouse_last_name,
          CONCAT_WS(' ', vs.first_name, vs.middle_name, vs.last_name) as spouse_full_name,
          vs.age as spouse_age,
          vs.birthdate as spouse_birthdate,
          vs.contact_number as spouse_contact,
          vs.educational_attainment as spouse_education,
          vs.occupation as spouse_occupation,
          -- Child details (no age)
          vc.vendor_child_id,
          vc.first_name as child_first_name,
          vc.middle_name as child_middle_name,
          vc.last_name as child_last_name,
          CONCAT_WS(' ', vc.first_name, vc.middle_name, vc.last_name) as child_full_name,
          vc.birthdate as child_birthdate,
          -- Business details
          vb.vendor_business_id,
          vb.business_name,
          vb.business_type,
          vb.business_description,
          vb.products,
          vb.vending_time_start,
          vb.vending_time_end,
          -- Location details (if assigned)
          al.assigned_location_id,
          al.location_name,
          al.location_type,
          al.assigned_date,
          -- Count of documents
          (SELECT COUNT(*) FROM vendor_documents vd WHERE vd.vendor_document_id = v.vendor_document_id) as document_count
        FROM vendor v
        LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
        LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
        LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
        LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
        ORDER BY v.created_at DESC;
      END
    `);
    console.log('✅ sp_getAllVendorsWithRelations fixed successfully\n');

    // ========================================
    // 3. GET VENDOR BY ID WITH RELATIONS (FIXED)
    // ========================================
    console.log('3️⃣ Fixing sp_getVendorWithRelations...');
    await conn.query('DROP PROCEDURE IF EXISTS getVendorWithRelations');
    await conn.query(`
      CREATE PROCEDURE getVendorWithRelations(IN p_vendor_id INT)
      BEGIN
        SELECT 
          v.vendor_id,
          v.first_name,
          v.middle_name,
          v.last_name,
          v.suffix,
          CONCAT_WS(' ', v.first_name, v.middle_name, v.last_name, v.suffix) as full_name,
          v.contact_number,
          v.email,
          v.birthdate,
          v.gender,
          v.address,
          v.civil_status,
          v.vendor_identifier,
          v.status,
          v.created_at,
          v.updated_at,
          -- Spouse details
          vs.vendor_spouse_id,
          vs.first_name as spouse_first_name,
          vs.middle_name as spouse_middle_name,
          vs.last_name as spouse_last_name,
          CONCAT_WS(' ', vs.first_name, vs.middle_name, vs.last_name) as spouse_full_name,
          vs.age as spouse_age,
          vs.birthdate as spouse_birthdate,
          vs.contact_number as spouse_contact,
          vs.educational_attainment as spouse_education,
          vs.occupation as spouse_occupation,
          -- Child details (no age)
          vc.vendor_child_id,
          vc.first_name as child_first_name,
          vc.middle_name as child_middle_name,
          vc.last_name as child_last_name,
          CONCAT_WS(' ', vc.first_name, vc.middle_name, vc.last_name) as child_full_name,
          vc.birthdate as child_birthdate,
          -- Business details
          vb.vendor_business_id,
          vb.business_name,
          vb.business_type,
          vb.business_description,
          vb.products,
          vb.vending_time_start,
          vb.vending_time_end,
          -- Location details (if assigned)
          al.assigned_location_id,
          al.location_name,
          al.location_type,
          al.assigned_date
        FROM vendor v
        LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
        LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
        LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
        LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
        WHERE v.vendor_id = p_vendor_id;
      END
    `);
    console.log('✅ sp_getVendorWithRelations fixed successfully\n');

    // ========================================
    // 4. UPDATE VENDOR WITH RELATIONS (FIXED)
    // ========================================
    console.log('4️⃣ Fixing sp_updateVendorWithRelations...');
    await conn.query('DROP PROCEDURE IF EXISTS updateVendorWithRelations');
    await conn.query(`
      CREATE PROCEDURE updateVendorWithRelations(
        IN p_vendor_id INT,
        -- Vendor personal info
        IN p_first_name VARCHAR(100),
        IN p_last_name VARCHAR(100),
        IN p_middle_name VARCHAR(100),
        IN p_suffix VARCHAR(10),
        IN p_contact_number VARCHAR(100),
        IN p_email VARCHAR(100),
        IN p_birthdate DATE,
        IN p_gender VARCHAR(10),
        IN p_address TEXT,
        IN p_vendor_identifier VARCHAR(45),
        IN p_status VARCHAR(20),
        -- Spouse info (full name)
        IN p_spouse_first_name VARCHAR(45),
        IN p_spouse_middle_name VARCHAR(45),
        IN p_spouse_last_name VARCHAR(45),
        IN p_spouse_age VARCHAR(5),
        IN p_spouse_birthdate DATE,
        IN p_spouse_education VARCHAR(45),
        IN p_spouse_contact VARCHAR(20),
        IN p_spouse_occupation VARCHAR(45),
        -- Child info (no age)
        IN p_child_first_name VARCHAR(45),
        IN p_child_middle_name VARCHAR(45),
        IN p_child_last_name VARCHAR(45),
        IN p_child_birthdate DATE,
        -- Business info
        IN p_business_name VARCHAR(100),
        IN p_business_type VARCHAR(100),
        IN p_business_description VARCHAR(255),
        IN p_vending_time_start TIME,
        IN p_vending_time_end TIME
      )
      BEGIN
        DECLARE v_spouse_id INT;
        DECLARE v_child_id INT;
        DECLARE v_business_id INT;
        
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;
        
        START TRANSACTION;
        
        -- Get existing IDs
        SELECT vendor_spouse_id, vendor_child_id, vendor_business_id
        INTO v_spouse_id, v_child_id, v_business_id
        FROM vendor
        WHERE vendor_id = p_vendor_id;
        
        -- Update or create spouse
        IF p_spouse_first_name IS NOT NULL THEN
          IF v_spouse_id IS NOT NULL THEN
            UPDATE vendor_spouse SET
              first_name = p_spouse_first_name,
              middle_name = p_spouse_middle_name,
              last_name = p_spouse_last_name,
              age = p_spouse_age,
              birthdate = p_spouse_birthdate,
              educational_attainment = p_spouse_education,
              contact_number = p_spouse_contact,
              occupation = p_spouse_occupation,
              updated_at = NOW()
            WHERE vendor_spouse_id = v_spouse_id;
          ELSE
            INSERT INTO vendor_spouse (
              first_name, middle_name, last_name, age, birthdate, educational_attainment,
              contact_number, occupation, created_at, updated_at
            ) VALUES (
              p_spouse_first_name, p_spouse_middle_name, p_spouse_last_name,
              p_spouse_age, p_spouse_birthdate,
              p_spouse_education, p_spouse_contact, p_spouse_occupation,
              NOW(), NOW()
            );
            SET v_spouse_id = LAST_INSERT_ID();
          END IF;
        END IF;
        
        -- Update or create child (no age)
        IF p_child_first_name IS NOT NULL THEN
          IF v_child_id IS NOT NULL THEN
            UPDATE vendor_child SET
              first_name = p_child_first_name,
              middle_name = p_child_middle_name,
              last_name = p_child_last_name,
              birthdate = p_child_birthdate,
              updated_at = NOW()
            WHERE vendor_child_id = v_child_id;
          ELSE
            INSERT INTO vendor_child (
              first_name, middle_name, last_name, birthdate, created_at, updated_at
            ) VALUES (
              p_child_first_name, p_child_middle_name, p_child_last_name,
              p_child_birthdate, NOW(), NOW()
            );
            SET v_child_id = LAST_INSERT_ID();
          END IF;
        END IF;
        
        -- Update or create business
        IF p_business_name IS NOT NULL THEN
          IF v_business_id IS NOT NULL THEN
            UPDATE vendor_business SET
              business_name = p_business_name,
              business_type = p_business_type,
              business_description = p_business_description,
              vending_time_start = p_vending_time_start,
              vending_time_end = p_vending_time_end,
              updated_at = NOW()
            WHERE vendor_business_id = v_business_id;
          ELSE
            INSERT INTO vendor_business (
              business_name, business_type, business_description,
              vending_time_start, vending_time_end, created_at, updated_at
            ) VALUES (
              p_business_name, p_business_type, p_business_description,
              p_vending_time_start, p_vending_time_end, NOW(), NOW()
            );
            SET v_business_id = LAST_INSERT_ID();
          END IF;
        END IF;
        
        -- Update vendor
        UPDATE vendor SET
          first_name = p_first_name,
          last_name = p_last_name,
          middle_name = p_middle_name,
          suffix = p_suffix,
          contact_number = p_contact_number,
          email = p_email,
          birthdate = p_birthdate,
          gender = p_gender,
          address = p_address,
          vendor_identifier = p_vendor_identifier,
          status = p_status,
          vendor_spouse_id = v_spouse_id,
          vendor_child_id = v_child_id,
          vendor_business_id = v_business_id,
          updated_at = NOW()
        WHERE vendor_id = p_vendor_id;
        
        COMMIT;
        
        SELECT 'Vendor updated successfully' as message;
      END
    `);
    console.log('✅ sp_updateVendorWithRelations fixed successfully\n');

    // Keep existing procedures 5-8 unchanged (they don't reference the problematic columns)
    console.log('5️⃣ Recreating sp_deleteVendorWithRelations...');
    await conn.query('DROP PROCEDURE IF EXISTS deleteVendorWithRelations');
    await conn.query(`
      CREATE PROCEDURE deleteVendorWithRelations(
        IN p_vendor_id INT,
        IN p_hard_delete BOOLEAN
      )
      BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          ROLLBACK;
          RESIGNAL;
        END;
        
        START TRANSACTION;
        
        IF p_hard_delete = TRUE THEN
          DELETE FROM vendor WHERE vendor_id = p_vendor_id;
        ELSE
          UPDATE vendor 
          SET status = 'Inactive', updated_at = NOW()
          WHERE vendor_id = p_vendor_id;
        END IF;
        
        COMMIT;
        
        SELECT 'Vendor deleted successfully' as message;
      END
    `);
    console.log('✅ sp_deleteVendorWithRelations recreated\n');

    // ========================================
    // VERIFICATION
    // ========================================
    console.log('\n========================================');
    console.log('🔍 VERIFYING FIXED STORED PROCEDURES...\n');
    
    const [procedures] = await conn.query(`
      SELECT ROUTINE_NAME 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = DATABASE() 
      AND ROUTINE_TYPE = 'PROCEDURE'
      AND (ROUTINE_NAME LIKE '%Vendor%' OR ROUTINE_NAME LIKE '%vendor%')
      ORDER BY ROUTINE_NAME
    `);
    
    console.log('✅ Found vendor stored procedures:');
    procedures.forEach(proc => {
      console.log(`   - ${proc.ROUTINE_NAME}`);
    });

    // Test the fixed procedure
    console.log('\n🧪 Testing getAllVendorsWithRelations...');
    try {
      const [result] = await conn.query('CALL getAllVendorsWithRelations()');
      console.log(`✅ Procedure works! Found ${result[0]?.length || 0} vendors`);
    } catch (testError) {
      console.error('❌ Test failed:', testError.message);
    }

    console.log('\n========================================');
    console.log('✅ ALL VENDOR STORED PROCEDURES FIXED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error fixing vendor procedures:', error.message);
    console.error(error);
  } finally {
    await conn.end();
    console.log('🔌 Database connection closed');
  }
})();
