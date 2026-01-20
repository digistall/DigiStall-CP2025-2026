const mysql = require('mysql2/promise');

async function fixStallholderSchema() {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 FIXING STALLHOLDER TABLE SCHEMA\n');

    // 1. Add full_name column to stallholder
    console.log('1️⃣ Adding full_name column to stallholder table...');
    try {
      await conn.query(`
        ALTER TABLE stallholder 
        ADD COLUMN full_name VARCHAR(500) AFTER mobile_user_id
      `);
      console.log('✅ Column added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Column already exists');
      } else {
        throw err;
      }
    }

    // 2. Migrate existing data from first_name + last_name to full_name
    console.log('2️⃣ Migrating data from first_name + last_name to full_name...');
    await conn.query(`
      UPDATE stallholder 
      SET full_name = CONCAT(IFNULL(first_name, ''), ' ', IFNULL(last_name, ''))
      WHERE full_name IS NULL OR full_name = ''
    `);
    console.log('✅ Data migrated');

    // 3. Drop first_name and last_name columns
    console.log('3️⃣ Dropping first_name and last_name columns...');
    try {
      await conn.query(`ALTER TABLE stallholder DROP COLUMN first_name`);
      console.log('✅ Dropped first_name');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ first_name already dropped');
      } else {
        throw err;
      }
    }
    
    try {
      await conn.query(`ALTER TABLE stallholder DROP COLUMN last_name`);
      console.log('✅ Dropped last_name');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ last_name already dropped');
      } else {
        throw err;
      }
    }

    // 4. Fix sp_getCredentialWithApplicant
    console.log('4️⃣ Fixing sp_getCredentialWithApplicant...');
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
          a.applicant_full_name,
          a.applicant_contact_number,
          a.applicant_address,
          a.applicant_birthdate,
          a.applicant_civil_status,
          a.applicant_educational_attainment,
          a.created_at as created_date
        FROM credential c
        LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
        WHERE c.username = p_username;
      END
    `);
    console.log('✅ Done');

    // 5. Fix sp_getFullStallholderInfo
    console.log('5️⃣ Fixing sp_getFullStallholderInfo...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getFullStallholderInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getFullStallholderInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          sh.stallholder_id,
          sh.full_name as stallholder_name,
          sh.contact_number as stallholder_contact,
          sh.email as stallholder_email,
          sh.address as stallholder_address,
          sh.branch_id,
          b.branch_name,
          sh.stall_id,
          s.stall_number,
          s.stall_location,
          s.size,
          sh.move_in_date as contract_start_date,
          sh.status as contract_status,
          s.rental_price as monthly_rent,
          sh.payment_status
        FROM stallholder sh
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        WHERE sh.mobile_user_id = p_applicant_id;
      END
    `);
    console.log('✅ Done');

    // 6. Fix sp_getStallholderStallsForDocuments
    console.log('6️⃣ Fixing sp_getStallholderStallsForDocuments...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallholderStallsForDocuments');
    await conn.query(`
      CREATE PROCEDURE sp_getStallholderStallsForDocuments(IN p_applicant_id INT)
      BEGIN
        SELECT 
          sh.stallholder_id,
          sh.full_name as stallholder_name,
          sh.email as stallholder_email,
          sh.contact_number as stallholder_contact,
          sh.address as stallholder_address,
          sh.branch_id,
          sh.stall_id,
          sh.payment_status,
          sh.status as contract_status,
          sh.move_in_date as contract_start_date,
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

    console.log('\n✅ STALLHOLDER SCHEMA FIXED!');
    console.log('\n📋 Summary:');
    console.log('   - Added full_name column to stallholder');
    console.log('   - Migrated data from first_name + last_name');
    console.log('   - Dropped first_name and last_name columns');
    console.log('   - Fixed sp_getCredentialWithApplicant to use applicant_full_name');
    console.log('   - Fixed sp_getFullStallholderInfo to use full_name');
    console.log('   - Fixed sp_getStallholderStallsForDocuments to use full_name');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixStallholderSchema();
