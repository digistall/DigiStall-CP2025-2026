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
    console.log('🔧 FIXING ALL MOBILE LOGIN STORED PROCEDURES\n');

    // 1. getApplicantApplicationsDetailed
    console.log('1️⃣ Creating getApplicantApplicationsDetailed...');
    await conn.query('DROP PROCEDURE IF EXISTS getApplicantApplicationsDetailed');
    await conn.query(`
      CREATE PROCEDURE getApplicantApplicationsDetailed(IN p_applicant_id INT)
      BEGIN
        SELECT 
          app.application_id,
          app.applicant_id,
          app.stall_id,
          app.application_status,
          app.application_date,
          app.updated_at,
          s.stall_no as stall_number,
          s.size as stall_size,
          s.rental_price as monthly_rent,
          s.status as stall_status,
          b.branch_id,
          b.branch_name,
          b.area,
          b.status as branch_status
        FROM application app
        INNER JOIN stall s ON app.stall_id = s.stall_id
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE app.applicant_id = p_applicant_id
        ORDER BY app.application_date DESC;
      END
    `);
    console.log('✅ getApplicantApplicationsDetailed created');

    // 2. getAvailableStallsByApplicant
    console.log('2️⃣ Creating getAvailableStallsByApplicant...');
    await conn.query('DROP PROCEDURE IF EXISTS getAvailableStallsByApplicant');
    await conn.query(`
      CREATE PROCEDURE getAvailableStallsByApplicant(IN p_applicant_id INT)
      BEGIN
        SELECT 
          s.stall_id,
          s.stall_no as stall_number,
          s.size as stall_size,
          s.rental_price as monthly_rent,
          s.status,
          s.is_available,
          b.branch_id,
          b.branch_name,
          b.area,
          b.status as branch_status,
          CASE 
            WHEN app.application_id IS NOT NULL THEN 'applied'
            WHEN s.is_available = 1 AND s.status = 'Active' THEN 'available'
            ELSE 'unavailable'
          END as application_status
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN application app ON s.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
        WHERE s.status = 'Active' 
          AND b.status = 'Active'
        ORDER BY b.area, b.branch_name, s.stall_no;
      END
    `);
    console.log('✅ getAvailableStallsByApplicant created');

    // 3. getAllActiveBranches
    console.log('3️⃣ Creating getAllActiveBranches...');
    await conn.query('DROP PROCEDURE IF EXISTS getAllActiveBranches');
    await conn.query(`
      CREATE PROCEDURE getAllActiveBranches()
      BEGIN
        SELECT 
          branch_id,
          branch_name,
          area,
          status
        FROM branch
        WHERE status = 'Active'
        ORDER BY area, branch_name;
      END
    `);
    console.log('✅ getAllActiveBranches created');

    // 4. getApplicantAdditionalInfo
    console.log('4️⃣ Creating getApplicantAdditionalInfo...');
    await conn.query('DROP PROCEDURE IF EXISTS getApplicantAdditionalInfo');
    await conn.query(`
      CREATE PROCEDURE getApplicantAdditionalInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          oi.email_address,
          oi.signature_of_applicant,
          oi.house_sketch_location,
          oi.valid_id,
          bi.nature_of_business,
          bi.capitalization,
          bi.source_of_capital,
          bi.previous_business_experience,
          bi.relative_stall_owner,
          sp.spouse_full_name,
          sp.spouse_birthdate,
          sp.spouse_educational_attainment,
          sp.spouse_contact_number,
          sp.spouse_occupation
        FROM applicant a
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
        WHERE a.applicant_id = p_applicant_id
        LIMIT 1;
      END
    `);
    console.log('✅ getApplicantAdditionalInfo created');

    // 5. sp_getFullStallholderInfo
    console.log('5️⃣ Creating sp_getFullStallholderInfo...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getFullStallholderInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getFullStallholderInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          sh.stallholder_id,
          CONCAT(sh.first_name, ' ', sh.last_name) as stallholder_name,
          sh.first_name,
          sh.last_name,
          sh.business_name,
          sh.business_type,
          sh.contact_number as stallholder_contact,
          sh.email as stallholder_email,
          sh.address as stallholder_address,
          sh.branch_id,
          sh.stall_id,
          sh.contract_start_date,
          sh.contract_end_date,
          sh.contract_status,
          sh.compliance_status,
          sh.payment_status,
          s.stall_no,
          s.size,
          s.rental_price as monthly_rent,
          s.stall_location,
          b.branch_name,
          b.area as branch_area
        FROM stallholder sh
        INNER JOIN stall s ON sh.stall_id = s.stall_id
        INNER JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.applicant_id = p_applicant_id
        LIMIT 1;
      END
    `);
    console.log('✅ sp_getFullStallholderInfo created');

    // 6. sp_getLatestApplicationInfo
    console.log('6️⃣ Creating sp_getLatestApplicationInfo...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getLatestApplicationInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getLatestApplicationInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          app.application_id,
          app.stall_id,
          app.application_status as status,
          app.application_date,
          s.stall_no,
          s.rental_price,
          b.branch_name
        FROM application app
        INNER JOIN stall s ON app.stall_id = s.stall_id
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE app.applicant_id = p_applicant_id
        ORDER BY app.application_date DESC
        LIMIT 1;
      END
    `);
    console.log('✅ sp_getLatestApplicationInfo created');

    // 7. updateCredentialLastLogin
    console.log('7️⃣ Creating updateCredentialLastLogin...');
    await conn.query('DROP PROCEDURE IF EXISTS updateCredentialLastLogin');
    await conn.query(`
      CREATE PROCEDURE updateCredentialLastLogin(IN p_applicant_id INT)
      BEGIN
        UPDATE credential 
        SET last_login = NOW()
        WHERE applicant_id = p_applicant_id;
      END
    `);
    console.log('✅ updateCredentialLastLogin created');

    // 8. Reset inspector password to bcrypt hashed version
    console.log('\n8️⃣ Resetting inspector password...');
    const bcrypt = require('bcrypt');
    const newPassword = 'inspector123'; // New password for inspector
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await conn.query(`
      UPDATE inspector 
      SET password = ?
      WHERE email = 'requiem121701@gmail.com'
    `, [passwordHash]);
    console.log('✅ Inspector password reset to: inspector123');

    // 9. Check if there's a collector to reset
    const [collectors] = await conn.query('SELECT * FROM collector WHERE email IS NOT NULL LIMIT 1');
    if (collectors.length > 0) {
      const collectorPassword = 'collector123';
      const collectorHash = await bcrypt.hash(collectorPassword, 10);
      await conn.query(`
        UPDATE collector 
        SET password = ?
        WHERE collector_id = ?
      `, [collectorHash, collectors[0].collector_id]);
      console.log('✅ Collector password reset to: collector123');
    }

    console.log('\n✅ ALL FIXES COMPLETE!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('  Stallholder: josonglaurente@gmail.com / iqg979');
    console.log('  Inspector:   requiem121701@gmail.com / inspector123');
    if (collectors.length > 0) {
      console.log('  Collector:   (check email) / collector123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
})();
