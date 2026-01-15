import mysql from 'mysql2/promise';

async function restoreFromBackup() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 RESTORING FROM YOUR BACKUP DATA (with correct column names)...\n');

    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // ============================================
    // 1. RESTORE BUSINESS MANAGERS
    // ============================================
    console.log('1️⃣ Restoring Business Managers...');
    await connection.execute('DELETE FROM business_manager');
    await connection.execute(`
      INSERT INTO business_manager (business_manager_id, branch_id, manager_username, manager_password_hash, first_name, last_name, email, contact_number, status, created_by_owner, created_at, updated_at, is_encrypted) VALUES 
      (1, 1, 'NCPM_Manager', '$2b$12$EjLG6ZsjvQAvFikVgAYVoew3gIuR7f.23j2eu92/IN9pnjJ7iMbVG', 'Juan', 'Dela Cruz', 'NCPM@gmail.com', '+63917111111', 'Active', 1, '2025-09-06 13:00:00', NOW(), 0),
      (2, 2, 'Satellite_Manager', '$2b$12$BBqcS.8r8jLyEGBcXssooe7RkFayxY9N82MJQRgrFv2ATAAcTkwwG', 'Zed', 'Shadows', 'zed.shadows@example.com', '+63919333333', 'Active', 1, '2025-09-08 13:49:24', NOW(), 0)
    `);
    console.log('   ✅ Business managers restored');

    // ============================================
    // 2. RESTORE BUSINESS EMPLOYEES
    // ============================================
    console.log('\n2️⃣ Restoring Business Employees...');
    await connection.execute('DELETE FROM business_employee');
    await connection.execute(`
      INSERT INTO business_employee (business_employee_id, employee_username, employee_password_hash, first_name, last_name, email, phone_number, branch_id, created_by_manager, permissions, status, created_at, updated_at, is_encrypted) VALUES 
      (1, 'EMP3672', '$2a$12$ys/pmarvhP5EFRctGdD4mOO3n.Kvmwqh1HYHaoBEl68EV092idhGq', 'Voun Irish', 'Dejumo', 'awfullumos@gmail.com', '09876543212', 1, 1, '["dashboard","payments","applicants","stalls"]', 'Active', '2025-11-06 05:36:23', NOW(), 0),
      (2, 'EMP8043', '$2a$12$t42cPqUynSJcLxoiFO.5dO4IvS14FecCXT4wJTzo6rk8AdLGOZf92', 'Jeno Aldrei', 'Laurente', 'laurentejenoaldrei@gmail.com', '09876543212', 1, 1, '["payments", "applicants"]', 'Active', '2025-12-03 04:03:26', NOW(), 0),
      (3, 'EMP1172', '$2a$12$GbsxNjjZrqiQdZpgL5aW8eP8H58oO0y8BAz4fdZjpBnU2oxseBbLC', 'Jiro', 'Laurente', 'requiem121701@gmail.com', '09365841267', 1, 1, '["stalls", "stallholders", "applicants"]', 'Active', '2025-12-29 06:54:37', NOW(), 0)
    `);
    console.log('   ✅ Business employees restored');

    // ============================================
    // 3. RESTORE COLLECTORS
    // ============================================
    console.log('\n3️⃣ Restoring Collectors...');
    await connection.execute('DELETE FROM collector');
    await connection.execute(`
      INSERT INTO collector (collector_id, username, password_hash, first_name, last_name, middle_name, email, contact_no, date_created, date_hired, status, is_encrypted) VALUES 
      (1, 'COL1001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxuR9H2', 'Maria', 'Santos', 'Cruz', 'maria.santos@digistall.com', '09171234567', NOW(), '2025-12-01', 'active', 0),
      (2, 'COL1002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxuR9H2', 'Juan', 'Reyes', 'Garcia', 'juan.reyes@digistall.com', '09187654321', NOW(), '2025-12-15', 'active', 0),
      (3, 'COL1003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxuR9H2', 'Ana', 'Mendoza', 'Lopez', 'ana.mendoza@digistall.com', '09191234567', NOW(), '2026-01-05', 'active', 0)
    `);
    console.log('   ✅ Collectors restored');

    // ============================================
    // 4. RESTORE INSPECTORS
    // ============================================
    console.log('\n4️⃣ Restoring Inspectors...');
    await connection.execute('DELETE FROM inspector');
    await connection.execute(`
      INSERT INTO inspector (inspector_id, username, first_name, last_name, middle_name, email, contact_no, password_hash, date_hired, status, is_encrypted) VALUES 
      (2, 'INS4526', 'Test', 'Inspector', '', 'test.inspector@test.com', '09123456789', '$2a$12$QYewA1/dWNjKPZRjcDglKefGNLFdgDS9AFsG.znv1xMk58IGMoJWm', '2025-12-24', 'inactive', 0),
      (3, 'INS1731', 'Jonas', 'Laurente', '', 'josonglaurente@gmail.com', '09126478585', '$2b$12$76h/FJRtK70sNGLQdIHXkuR4TTJoEQYgCAbeTemlQvLLSTY/mzezC', NULL, 'active', 0),
      (4, 'INS2775', 'Shim', 'Lu', '', 'shimrigabriel25@gmail.com', '09231123123', '$2b$12$76h/FJRtK70sNGLQdIHXkuR4TTJoEQYgCAbeTemlQvLLSTY/mzezC', NULL, 'active', 0)
    `);
    console.log('   ✅ Inspectors restored');

    // ============================================
    // 5. RESTORE APPLICANTS (before stallholders due to FK)
    // ============================================
    console.log('\n5️⃣ Restoring Applicants...');
    await connection.execute('DELETE FROM applicant');
    await connection.execute(`
      INSERT INTO applicant (applicant_id, applicant_full_name, applicant_contact_number, applicant_address, applicant_birthdate, applicant_civil_status, applicant_educational_attainment, created_at, updated_at, is_encrypted) VALUES 
      (1, 'Jeno Aldrei Laurente', '09473430196', 'Zone 5', '2005-01-24', 'Married', 'College Graduate', '2025-12-22 14:35:40', '2025-12-22 14:35:40', 0),
      (2, 'Elaine Zennia A. San jose', '09473430196', 'Magarao', '2005-06-03', 'Married', 'College Graduate', '2025-12-24 15:22:06', '2025-12-24 15:22:06', 0),
      (3, 'Elaine Zennia A. San jose', '09473430196', 'Magarao', '2005-06-03', 'Married', 'College Graduate', '2025-12-24 15:48:43', '2025-12-24 15:48:43', 0),
      (4, 'Jonas Laurente', '09473430196', 'Zone 5', '2001-01-24', 'Single', 'Postgraduate', '2025-12-25 15:56:36', '2025-12-25 15:56:36', 0),
      (6, 'Jiro Adrian A. Laurente', '09126471856', 'Milaor', '2006-12-18', 'Single', 'College Graduate', '2025-12-26 00:23:30', '2025-12-26 00:23:30', 0),
      (7, 'Alijah Jane A. Laurente', '09586471235', 'Francia', '2003-01-09', 'Single', 'College Graduate', '2025-12-26 00:27:42', '2025-12-26 00:27:42', 0),
      (8, 'Shimri Luansing', '09124678523', 'Calabanga', '1998-05-12', 'Single', 'College Graduate', '2025-12-27 13:23:36', '2025-12-27 13:23:36', 0),
      (9, 'Jean Laurenet', '09636584961', 'Milaor', '1977-11-30', 'Single', 'College Graduate', '2025-12-29 07:00:44', '2025-12-29 07:00:44', 0),
      (10, 'JKOB FRANKIE PENAFLOR', '09922072004', 'Camella Naga City', '2004-07-20', 'Single', 'College Graduate', '2026-01-07 14:11:07', '2026-01-07 14:11:07', 0)
    `);
    console.log('   ✅ Applicants restored');

    // ============================================
    // 6. RESTORE STALLHOLDERS
    // ============================================
    console.log('\n6️⃣ Restoring Stallholders...');
    await connection.execute('DELETE FROM stallholder');
    await connection.execute(`
      INSERT INTO stallholder (stallholder_id, applicant_id, stallholder_name, contact_number, email, address, business_name, business_type, branch_id, stall_id, contract_start_date, contract_end_date, contract_status, lease_amount, monthly_rent, payment_status, last_payment_date, compliance_status, date_created, updated_at, is_encrypted) VALUES 
      (1, 1, 'Jeno Aldrei Laurente', '09473430196', 'laurentejeno73@gmail.com', 'Zone 5', 'Flowers and Plants', 'Flowers and Plants', 1, 20, '2025-12-22', '2026-12-22', 'Active', 6662.56, 6662.56, 'pending', '2025-12-23', 'Compliant', '2025-12-22 14:35:59', NOW(), 0),
      (2, 8, 'Shimri Luansing', '09124678523', 'splashonmid@gmail.com', 'Calabanga', 'Food and Beverages', 'Food and Beverages', 1, 22, '2025-12-27', '2026-12-27', 'Active', 2061.22, 2061.22, 'pending', NULL, 'Compliant', '2025-12-27 13:24:19', NOW(), 0)
    `);
    console.log('   ✅ Stallholders restored');

    // ============================================
    // 7. RESTORE CREDENTIALS
    // ============================================
    console.log('\n7️⃣ Restoring Credentials...');
    await connection.execute('DELETE FROM credential');
    await connection.execute(`
      INSERT INTO credential (registrationid, applicant_id, user_name, password_hash, created_date, last_login, is_active) VALUES 
      (1, 1, '25-39683', '$2b$10$B8kn89UzDJrGU6Xie8tjY.MtM8UWmuWplTPEYQapXYhXXE7DnUnPq', '2025-12-22 14:35:59', '2026-01-07 09:13:29', 1),
      (2, 8, '25-90032', '$2b$10$B8kn89UzDJrGU6Xie8tjY.MtM8UWmuWplTPEYQapXYhXXE7DnUnPq', '2025-12-27 13:24:18', '2026-01-06 11:55:57', 1)
    `);
    console.log('   ✅ Credentials restored');

    // ============================================
    // 8. RESTORE SPOUSE
    // ============================================
    console.log('\n8️⃣ Restoring Spouse records...');
    await connection.execute('DELETE FROM spouse');
    await connection.execute(`
      INSERT INTO spouse (spouse_id, applicant_id, spouse_full_name, spouse_birthdate, spouse_educational_attainment, spouse_contact_number, spouse_occupation, created_at, updated_at, is_encrypted) VALUES 
      (1, 1, 'Elaine Zennia A. San Jose', '2005-06-03', 'College Graduate', '09126471858', 'Architecture', '2025-12-22 14:35:40', '2025-12-22 14:35:40', 0),
      (2, 2, 'Jeno Aldrei A. Laurente', '2005-01-24', 'College Graduate', '09126471858', 'IT', '2025-12-24 15:22:09', '2025-12-24 15:22:09', 0),
      (3, 3, 'Jeno Aldrei A. Laurente', '2005-01-24', 'College Graduate', '09126471858', 'IT', '2025-12-24 15:48:43', '2025-12-24 15:48:43', 0)
    `);
    console.log('   ✅ Spouse records restored');

    // ============================================
    // 9. RESTORE BUSINESS INFORMATION
    // ============================================
    console.log('\n9️⃣ Restoring Business Information...');
    await connection.execute('DELETE FROM business_information');
    // Columns: business_id, applicant_id, nature_of_business, capitalization, source_of_capital, previous_business_experience, relative_stall_owner, created_at, updated_at
    await connection.execute(`
      INSERT INTO business_information (business_id, applicant_id, nature_of_business, capitalization, source_of_capital, previous_business_experience, relative_stall_owner, created_at, updated_at) VALUES 
      (2, 2, 'Fish and Seafood', 50000.00, 'Personal Savings', 'None', 'No', '2025-12-24 15:22:09', '2025-12-24 15:22:09'),
      (3, 3, 'Fish and Seafood', 50000.00, 'Personal Savings', 'None', 'No', '2025-12-24 15:48:43', '2025-12-24 15:48:43'),
      (4, 4, 'Fish and Seafood', 52000.00, 'Personal Savings', 'None', 'No', '2025-12-25 15:56:37', '2025-12-25 15:56:37'),
      (5, 6, 'Meat', 250000.00, 'Personal Savings', 'None', 'No', '2025-12-26 00:23:30', '2025-12-26 00:23:30'),
      (6, 7, 'Clothing and Accessories', 50000.00, 'Personal Savings', 'None', 'No', '2025-12-26 00:27:42', '2025-12-26 00:27:42'),
      (7, 8, 'Food and Beverages', 50000.00, 'Personal Savings', 'None', 'No', '2025-12-27 13:23:36', '2025-12-27 13:23:36'),
      (8, 9, 'Candy Shop', 50000.00, 'Personal Savings', 'None', 'No', '2025-12-29 07:00:44', '2025-12-29 07:00:44'),
      (9, 10, 'Electronics', 35000.00, 'Personal Savings', 'PC units vendor', 'No', '2026-01-07 14:11:08', '2026-01-07 14:11:08')
    `);
    console.log('   ✅ Business information restored');

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION - ALL DATA RESTORED:');
    console.log('='.repeat(60));

    const [mgrCheck] = await connection.execute('SELECT business_manager_id, first_name, last_name, email FROM business_manager ORDER BY business_manager_id');
    console.log('\n📋 Business Managers:');
    console.table(mgrCheck);

    const [empCheck] = await connection.execute('SELECT business_employee_id, first_name, last_name, email FROM business_employee ORDER BY business_employee_id');
    console.log('\n👔 Business Employees:');
    console.table(empCheck);

    const [colCheck] = await connection.execute('SELECT collector_id, first_name, last_name, email FROM collector ORDER BY collector_id');
    console.log('\n💰 Collectors:');
    console.table(colCheck);

    const [insCheck] = await connection.execute('SELECT inspector_id, first_name, last_name, email FROM inspector ORDER BY inspector_id');
    console.log('\n🔍 Inspectors:');
    console.table(insCheck);

    const [shCheck] = await connection.execute('SELECT stallholder_id, stallholder_name, email FROM stallholder ORDER BY stallholder_id');
    console.log('\n🏪 Stallholders:');
    console.table(shCheck);

    const [appCheck] = await connection.execute('SELECT applicant_id, applicant_full_name, applicant_contact_number FROM applicant ORDER BY applicant_id');
    console.log('\n📝 Applicants:');
    console.table(appCheck);

    console.log('\n✅ ALL DATA RESTORED FROM YOUR BACKUP!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await connection.end();
  }
}

restoreFromBackup();
