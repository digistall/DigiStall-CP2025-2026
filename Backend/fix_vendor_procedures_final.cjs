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
    console.log('🔧 FINAL FIX FOR VENDOR MODULE STORED PROCEDURES\n');
    console.log('========================================\n');

    // ========================================
    // 2. GET ALL VENDORS WITH RELATIONS (FINAL FIX)
    // ========================================
    console.log('1️⃣ Final fix for getAllVendorsWithRelations...');
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
          -- Child details
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
          -- Location details (only what exists)
          al.assigned_location_id,
          al.location_name,
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
    console.log('✅ getAllVendorsWithRelations fixed\n');

    // ========================================
    // 3. GET VENDOR BY ID WITH RELATIONS (FINAL FIX)
    // ========================================
    console.log('2️⃣ Final fix for getVendorWithRelations...');
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
          -- Child details
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
          -- Location details (only what exists)
          al.assigned_location_id,
          al.location_name
        FROM vendor v
        LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
        LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
        LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
        LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
        WHERE v.vendor_id = p_vendor_id;
      END
    `);
    console.log('✅ getVendorWithRelations fixed\n');

    // ========================================
    // VERIFICATION
    // ========================================
    console.log('\n========================================');
    console.log('🧪 TESTING PROCEDURES...\n');
    
    // Test getAllVendorsWithRelations
    console.log('Testing getAllVendorsWithRelations...');
    try {
      const [result] = await conn.query('CALL getAllVendorsWithRelations()');
      console.log(`✅ getAllVendorsWithRelations works! Found ${result[0]?.length || 0} vendors`);
      if (result[0]?.length > 0) {
        console.log(`   Sample vendor: ${result[0][0].full_name || 'N/A'} (${result[0][0].email || 'No email'})`);
      }
    } catch (testError) {
      console.error('❌ Test failed:', testError.message);
    }

    // Test getVendorWithRelations with ID 1 (if exists)
    console.log('\nTesting getVendorWithRelations...');
    try {
      const [result] = await conn.query('CALL getVendorWithRelations(1)');
      if (result[0]?.length > 0) {
        console.log(`✅ getVendorWithRelations works! Vendor: ${result[0][0].full_name || 'N/A'}`);
      } else {
        console.log(`✅ getVendorWithRelations works (no vendor with ID 1)`);
      }
    } catch (testError) {
      console.error('❌ Test failed:', testError.message);
    }

    console.log('\n========================================');
    console.log('✅ VENDOR STORED PROCEDURES FULLY FIXED!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await conn.end();
    console.log('🔌 Database connection closed');
  }
})();
