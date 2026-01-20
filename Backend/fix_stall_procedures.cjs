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
    console.log('🔧 FIXING STALL STORED PROCEDURES\n');

    // 1. Fix sp_getStallsByTypeForApplicant
    console.log('1️⃣ Fixing sp_getStallsByTypeForApplicant...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallsByTypeForApplicant');
    await conn.query(`
      CREATE PROCEDURE sp_getStallsByTypeForApplicant(
        IN p_price_type VARCHAR(50),
        IN p_applicant_id INT,
        IN p_status VARCHAR(20)
      )
      BEGIN
        SELECT 
          st.stall_id,
          st.stall_number,
          st.stall_name,
          st.stall_type,
          st.stall_size,
          st.monthly_rent,
          st.rental_price,
          st.status,
          st.description,
          st.amenities,
          st.stall_location,
          st.size,
          st.area_sqm,
          st.base_rate,
          st.rate_per_sqm,
          st.price_type,
          st.is_available,
          st.raffle_auction_deadline,
          st.deadline_active,
          st.raffle_auction_status,
          b.branch_id,
          b.branch_name,
          b.area,
          f.floor_id,
          f.floor_name,
          sec.section_id,
          sec.section_name,
          CASE 
            WHEN app.application_id IS NOT NULL THEN 'applied'
            WHEN st.is_available = 1 AND st.status = 'Active' THEN 'available'
            ELSE 'unavailable'
          END as application_status,
          app.application_id as user_application_id
        FROM stall st
        INNER JOIN section sec ON st.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN application app ON st.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
        WHERE st.price_type = p_price_type
          AND st.status = COALESCE(p_status, st.status)
          AND b.status = 'Active'
        ORDER BY b.branch_name, f.floor_name, sec.section_name, st.stall_number;
      END
    `);
    console.log('✅ Done');

    // 2. Fix sp_getFullStallholderInfo to include stall_number
    console.log('2️⃣ Fixing sp_getFullStallholderInfo with stall_number...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getFullStallholderInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getFullStallholderInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          sh.stallholder_id,
          CONCAT(sh.first_name, ' ', sh.last_name) as stallholder_name,
          sh.first_name,
          sh.last_name,
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
          b.branch_name,
          b.area as branch_area
        FROM stallholder sh
        INNER JOIN stall s ON sh.stall_id = s.stall_id
        INNER JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.mobile_user_id = p_applicant_id
        LIMIT 1;
      END
    `);
    console.log('✅ Done');

    // 3. Fix sp_getLatestApplicationInfo with stall_number
    console.log('3️⃣ Fixing sp_getLatestApplicationInfo...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getLatestApplicationInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getLatestApplicationInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          app.application_id,
          app.stall_id,
          app.application_status as status,
          app.application_date,
          s.stall_number,
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
    console.log('✅ Done');

    // 4. Fix getApplicantApplicationsDetailed
    console.log('4️⃣ Fixing getApplicantApplicationsDetailed...');
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
          s.stall_number,
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
    console.log('✅ Done');

    // 5. Fix getAvailableStallsByApplicant
    console.log('5️⃣ Fixing getAvailableStallsByApplicant...');
    await conn.query('DROP PROCEDURE IF EXISTS getAvailableStallsByApplicant');
    await conn.query(`
      CREATE PROCEDURE getAvailableStallsByApplicant(IN p_applicant_id INT)
      BEGIN
        SELECT 
          s.stall_id,
          s.stall_number,
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
        ORDER BY b.area, b.branch_name, s.stall_number;
      END
    `);
    console.log('✅ Done');

    console.log('\n✅ ALL STALL STORED PROCEDURES FIXED!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
})();
