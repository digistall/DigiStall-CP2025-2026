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
    console.log('🔧 COMPREHENSIVE MOBILE FIX - ALL ISSUES\n');

    // ============================================
    // PART 1: FIX STALLHOLDER LOGIN STORED PROCEDURES
    // ============================================
    console.log('═'.repeat(50));
    console.log('PART 1: FIXING STALLHOLDER LOGIN STORED PROCEDURES');
    console.log('═'.repeat(50));

    // 1. getApplicantApplicationsDetailed - fix stall_no to stall_number
    console.log('\n1️⃣ Fixing getApplicantApplicationsDetailed...');
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

    // 2. getAvailableStallsByApplicant
    console.log('2️⃣ Fixing getAvailableStallsByApplicant...');
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

    // 3. sp_getFullStallholderInfo
    console.log('3️⃣ Fixing sp_getFullStallholderInfo...');
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
          s.stall_number,
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
    console.log('✅ Done');

    // 4. sp_getLatestApplicationInfo
    console.log('4️⃣ Fixing sp_getLatestApplicationInfo...');
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

    // ============================================
    // PART 2: ADD MISSING COLUMNS TO INSPECTOR/COLLECTOR
    // ============================================
    console.log('\n' + '═'.repeat(50));
    console.log('PART 2: ADDING MISSING COLUMNS');
    console.log('═'.repeat(50));

    // Add last_logout to inspector if not exists
    console.log('\n5️⃣ Adding last_logout column to inspector...');
    try {
      await conn.query('ALTER TABLE inspector ADD COLUMN last_logout datetime NULL');
      console.log('✅ Added last_logout to inspector');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column already exists');
      } else {
        console.log('⚠️ Warning:', e.message);
      }
    }

    // Add last_logout to collector if not exists
    console.log('6️⃣ Adding last_logout column to collector...');
    try {
      await conn.query('ALTER TABLE collector ADD COLUMN last_logout datetime NULL');
      console.log('✅ Added last_logout to collector');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column already exists');
      } else {
        console.log('⚠️ Warning:', e.message);
      }
    }

    // ============================================
    // PART 3: FIX STAFF ACTIVITY LOG STORED PROCEDURE
    // ============================================
    console.log('\n' + '═'.repeat(50));
    console.log('PART 3: FIXING STAFF STORED PROCEDURES');
    console.log('═'.repeat(50));

    // Fix sp_logStaffActivity - use user_type and user_id instead of staff_type and staff_id
    console.log('\n7️⃣ Fixing sp_logStaffActivity...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_logStaffActivity');
    await conn.query(`
      CREATE PROCEDURE sp_logStaffActivity(
        IN p_user_type VARCHAR(50),
        IN p_user_id INT,
        IN p_action_type VARCHAR(100),
        IN p_action_description TEXT,
        IN p_target_type VARCHAR(50),
        IN p_target_id INT,
        IN p_ip_address VARCHAR(45),
        IN p_user_agent TEXT,
        IN p_extra1 VARCHAR(255),
        IN p_extra2 VARCHAR(255),
        IN p_extra3 VARCHAR(255)
      )
      BEGIN
        INSERT INTO staff_activity_log (
          user_type, user_id, action_type, action_description,
          target_type, target_id, ip_address, user_agent, created_at
        ) VALUES (
          p_user_type, p_user_id, p_action_type, p_action_description,
          p_target_type, p_target_id, p_ip_address, p_user_agent, NOW()
        );
        SELECT LAST_INSERT_ID() as log_id;
      END
    `);
    console.log('✅ Done');

    // Fix sp_createStaffSession - use user_type and user_id
    console.log('8️⃣ Fixing sp_createStaffSession...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_createStaffSession');
    await conn.query(`
      CREATE PROCEDURE sp_createStaffSession(
        IN p_user_type VARCHAR(50),
        IN p_user_id INT,
        IN p_session_token VARCHAR(255),
        IN p_refresh_token_hash VARCHAR(255),
        IN p_ip_address VARCHAR(45),
        IN p_user_agent TEXT
      )
      BEGIN
        -- Deactivate any existing sessions
        UPDATE staff_session 
        SET is_active = 0, logout_time = NOW()
        WHERE user_id = p_user_id AND user_type = p_user_type AND is_active = 1;
        
        -- Create new session
        INSERT INTO staff_session (
          user_type, user_id, session_token, refresh_token_hash,
          ip_address, user_agent, login_time, last_activity, is_active
        ) VALUES (
          p_user_type, p_user_id, p_session_token, p_refresh_token_hash,
          p_ip_address, p_user_agent, NOW(), NOW(), 1
        );
        SELECT LAST_INSERT_ID() as session_id;
      END
    `);
    console.log('✅ Done');

    // Fix sp_updateStaffSession - use user_type and user_id
    console.log('9️⃣ Fixing sp_updateStaffSession...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_updateStaffSession');
    await conn.query(`
      CREATE PROCEDURE sp_updateStaffSession(
        IN p_user_type VARCHAR(50),
        IN p_user_id INT
      )
      BEGIN
        UPDATE staff_session 
        SET last_activity = NOW()
        WHERE user_id = p_user_id AND user_type = p_user_type AND is_active = 1;
        SELECT ROW_COUNT() as updated;
      END
    `);
    console.log('✅ Done');

    // Fix sp_endStaffSession
    console.log('🔟 Fixing sp_endStaffSession...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_endStaffSession');
    await conn.query(`
      CREATE PROCEDURE sp_endStaffSession(
        IN p_user_type VARCHAR(50),
        IN p_user_id INT
      )
      BEGIN
        UPDATE staff_session 
        SET is_active = 0, logout_time = NOW()
        WHERE user_id = p_user_id AND user_type = p_user_type AND is_active = 1;
        SELECT ROW_COUNT() as ended;
      END
    `);
    console.log('✅ Done');

    // Fix sp_getStaffSession
    console.log('1️⃣1️⃣ Fixing sp_getStaffSession...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStaffSession');
    await conn.query(`
      CREATE PROCEDURE sp_getStaffSession(
        IN p_user_type VARCHAR(50),
        IN p_user_id INT
      )
      BEGIN
        SELECT session_id, user_type, user_id, session_token, 
               ip_address, login_time, last_activity, is_active
        FROM staff_session 
        WHERE user_id = p_user_id AND user_type = p_user_type AND is_active = 1
        LIMIT 1;
      END
    `);
    console.log('✅ Done');

    console.log('\n' + '═'.repeat(50));
    console.log('✅ ALL FIXES COMPLETE!');
    console.log('═'.repeat(50));
    console.log('\n📝 Summary:');
    console.log('  ✅ Fixed 4 stallholder login stored procedures (stall_number)');
    console.log('  ✅ Added last_logout columns to inspector/collector');
    console.log('  ✅ Fixed 5 staff session/activity stored procedures');
    console.log('\n🚀 Try logging in again!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
})();
