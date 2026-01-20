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
    console.log('🔧 FINAL COMPREHENSIVE FIX - ALL MOBILE ISSUES\n');

    // ============================================
    // PART 1: FIX STALLHOLDER LOGIN - Remove business_name
    // ============================================
    console.log('═'.repeat(50));
    console.log('PART 1: FIX STALLHOLDER LOGIN STORED PROCEDURE');
    console.log('═'.repeat(50));

    console.log('\n1️⃣ Fixing sp_getFullStallholderInfo (no business_name)...');
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

    // ============================================
    // PART 2: FIX PAYMENT STORED PROCEDURE
    // ============================================
    console.log('\n' + '═'.repeat(50));
    console.log('PART 2: FIX PAYMENT STORED PROCEDURE');
    console.log('═'.repeat(50));

    console.log('\n2️⃣ Fixing sp_getOnsitePaymentsByBranchesDecrypted...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsByBranchesDecrypted');
    await conn.query(`
      CREATE PROCEDURE sp_getOnsitePaymentsByBranchesDecrypted(
        IN p_branch_ids VARCHAR(500),
        IN p_start_date VARCHAR(20),
        IN p_end_date VARCHAR(20),
        IN p_staff_id INT
      )
      BEGIN
        SET @sql = CONCAT('
          SELECT 
            dp.payment_id,
            dp.stallholder_id,
            CONCAT(sh.first_name, \" \", sh.last_name) as stallholder_name,
            dp.amount,
            dp.payment_date,
            dp.payment_method,
            dp.payment_type,
            dp.receipt_number,
            dp.status,
            dp.remarks,
            dp.collected_by,
            s.stall_number,
            s.stall_id,
            b.branch_id,
            b.branch_name
          FROM daily_payment dp
          INNER JOIN stallholder sh ON dp.stallholder_id = sh.stallholder_id
          INNER JOIN stall s ON sh.stall_id = s.stall_id
          INNER JOIN branch b ON sh.branch_id = b.branch_id
          WHERE dp.payment_method = \"Cash\"
            AND b.branch_id IN (', p_branch_ids, ')
        ');
        
        IF p_start_date IS NOT NULL AND p_start_date != '' THEN
          SET @sql = CONCAT(@sql, ' AND DATE(dp.payment_date) >= \"', p_start_date, '\"');
        END IF;
        
        IF p_end_date IS NOT NULL AND p_end_date != '' THEN
          SET @sql = CONCAT(@sql, ' AND DATE(dp.payment_date) <= \"', p_end_date, '\"');
        END IF;
        
        SET @sql = CONCAT(@sql, ' ORDER BY dp.payment_date DESC');
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
    `);
    console.log('✅ Done');

    console.log('\n3️⃣ Fixing sp_getOnlinePaymentsByBranchesDecrypted...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsByBranchesDecrypted');
    await conn.query(`
      CREATE PROCEDURE sp_getOnlinePaymentsByBranchesDecrypted(
        IN p_branch_ids VARCHAR(500),
        IN p_start_date VARCHAR(20),
        IN p_end_date VARCHAR(20),
        IN p_staff_id INT
      )
      BEGIN
        SET @sql = CONCAT('
          SELECT 
            dp.payment_id,
            dp.stallholder_id,
            CONCAT(sh.first_name, \" \", sh.last_name) as stallholder_name,
            dp.amount,
            dp.payment_date,
            dp.payment_method,
            dp.payment_type,
            dp.receipt_number,
            dp.status,
            dp.remarks,
            dp.collected_by,
            s.stall_number,
            s.stall_id,
            b.branch_id,
            b.branch_name
          FROM daily_payment dp
          INNER JOIN stallholder sh ON dp.stallholder_id = sh.stallholder_id
          INNER JOIN stall s ON sh.stall_id = s.stall_id
          INNER JOIN branch b ON sh.branch_id = b.branch_id
          WHERE dp.payment_method != \"Cash\"
            AND b.branch_id IN (', p_branch_ids, ')
        ');
        
        IF p_start_date IS NOT NULL AND p_start_date != '' THEN
          SET @sql = CONCAT(@sql, ' AND DATE(dp.payment_date) >= \"', p_start_date, '\"');
        END IF;
        
        IF p_end_date IS NOT NULL AND p_end_date != '' THEN
          SET @sql = CONCAT(@sql, ' AND DATE(dp.payment_date) <= \"', p_end_date, '\"');
        END IF;
        
        SET @sql = CONCAT(@sql, ' ORDER BY dp.payment_date DESC');
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
    `);
    console.log('✅ Done');

    // ============================================
    // PART 3: FIX STAFF ACTIVITY LOG - Simpler version
    // ============================================
    console.log('\n' + '═'.repeat(50));
    console.log('PART 3: FIX STAFF ACTIVITY LOG STORED PROCEDURE');
    console.log('═'.repeat(50));

    console.log('\n4️⃣ Fixing sp_logStaffActivity (simpler version)...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_logStaffActivity');
    await conn.query(`
      CREATE PROCEDURE sp_logStaffActivity(
        IN p_user_type VARCHAR(50),
        IN p_user_id INT,
        IN p_staff_name VARCHAR(255),
        IN p_branch_id INT,
        IN p_action_type VARCHAR(100),
        IN p_action_description TEXT,
        IN p_module VARCHAR(100),
        IN p_ip_address VARCHAR(45),
        IN p_user_agent TEXT,
        IN p_status VARCHAR(50),
        IN p_timestamp VARCHAR(50)
      )
      BEGIN
        INSERT INTO staff_activity_log (
          user_type, user_id, action_type, action_description,
          target_type, target_id, ip_address, user_agent, created_at
        ) VALUES (
          p_user_type, p_user_id, p_action_type, p_action_description,
          p_module, p_branch_id, p_ip_address, p_user_agent, NOW()
        );
        SELECT LAST_INSERT_ID() as log_id;
      END
    `);
    console.log('✅ Done');

    console.log('\n' + '═'.repeat(50));
    console.log('✅ ALL DATABASE FIXES COMPLETE!');
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
})();
