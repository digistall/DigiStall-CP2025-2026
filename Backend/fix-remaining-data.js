import mysql from 'mysql2/promise';

async function fixRemainingData() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 FIXING REMAINING DATA ISSUES...\n');

    // ============================================
    // 1. FIX BUSINESS EMPLOYEES
    // ============================================
    console.log('1️⃣ Fixing Business Employees...');
    
    // First check what employees exist
    const [empList] = await connection.execute('SELECT business_employee_id, first_name, last_name, email FROM business_employee');
    console.log('   Current employees:', empList);
    
    // Delete fake employees (those with EMP#### pattern as first_name)
    await connection.execute("DELETE FROM business_employee WHERE first_name LIKE 'EMP%'");
    console.log('   ✅ Removed fake employees');
    
    // Re-insert original employees
    const employees = [
      { 
        id: 1, 
        username: 'EMP3672',
        password_hash: '$2a$12$ys/pmarvhP5EFRctGdD4mOO3n.Kvmwqh1HYHaoBEl68EV092idhGq',
        first_name: 'Voun Irish', 
        last_name: 'Dejumo', 
        email: 'awfullumos@gmail.com', 
        phone_number: '09876543212',
        branch_id: 3,
        created_by_manager: 3,
        permissions: '["dashboard","payments","applicants","stalls"]',
        status: 'Active'
      },
      { 
        id: 2, 
        username: 'EMP8043',
        password_hash: '$2a$12$t42cPqUynSJcLxoiFO.5dO4IvS14FecCXT4wJTzo6rk8AdLGOZf92',
        first_name: 'Jeno Aldrei', 
        last_name: 'Laurente', 
        email: 'laurentejenoaldrei@gmail.com', 
        phone_number: '09876543212',
        branch_id: 1,
        created_by_manager: 1,
        permissions: '["dashboard","payments","applicants"]',
        status: 'Active'
      }
    ];

    for (const emp of employees) {
      // Check if exists
      const [existing] = await connection.execute(
        'SELECT business_employee_id FROM business_employee WHERE business_employee_id = ?',
        [emp.id]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          `INSERT INTO business_employee 
            (business_employee_id, employee_username, employee_password_hash, first_name, last_name, 
             email, phone_number, branch_id, created_by_manager, permissions, status, is_encrypted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [emp.id, emp.username, emp.password_hash, emp.first_name, emp.last_name,
           emp.email, emp.phone_number, emp.branch_id, emp.created_by_manager, emp.permissions, emp.status]
        );
        console.log(`   ✅ Inserted employee ${emp.id}: ${emp.first_name} ${emp.last_name}`);
      } else {
        await connection.execute(
          `UPDATE business_employee SET 
            first_name = ?, last_name = ?, email = ?, phone_number = ?,
            encrypted_first_name = NULL, encrypted_last_name = NULL, 
            encrypted_email = NULL, encrypted_contact = NULL, is_encrypted = 0
          WHERE business_employee_id = ?`,
          [emp.first_name, emp.last_name, emp.email, emp.phone_number, emp.id]
        );
        console.log(`   ✅ Updated employee ${emp.id}: ${emp.first_name} ${emp.last_name}`);
      }
    }

    // ============================================
    // 2. FIX COLLECTORS
    // ============================================
    console.log('\n2️⃣ Fixing Collectors...');
    
    // Check what collectors exist
    const [colList] = await connection.execute('SELECT collector_id, first_name, last_name FROM collector');
    console.log('   Current collectors:', colList);
    
    // Re-insert original collector
    const collectors = [
      { 
        id: 1, 
        username: 'COL6806',
        password_hash: '$2a$12$fyruXNao5wSK1v4DarRBLO03o/odeWS/P9Y9X98ml/RbYWTPNqZIK',
        first_name: 'Jeno Aldrei', 
        last_name: 'Laurente', 
        email: 'laurentejeno73@gmail.com', 
        contact_no: '09473430196',
        status: 'active'
      }
    ];

    for (const col of collectors) {
      const [existing] = await connection.execute(
        'SELECT collector_id FROM collector WHERE collector_id = ?',
        [col.id]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          `INSERT INTO collector 
            (collector_id, username, password_hash, first_name, last_name, email, contact_no, status, date_created, date_hired, is_encrypted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), CURDATE(), 0)`,
          [col.id, col.username, col.password_hash, col.first_name, col.last_name, col.email, col.contact_no, col.status]
        );
        console.log(`   ✅ Inserted collector ${col.id}: ${col.first_name} ${col.last_name}`);
      }
    }

    // ============================================
    // 3. FIX MANAGER 3 (Jonas Laurente)
    // ============================================
    console.log('\n3️⃣ Checking Manager 3...');
    const [mgr3] = await connection.execute('SELECT business_manager_id FROM business_manager WHERE business_manager_id = 3');
    if (mgr3.length === 0) {
      await connection.execute(
        `INSERT INTO business_manager 
          (business_manager_id, branch_id, manager_username, manager_password_hash, first_name, last_name, status, created_by_owner, is_encrypted)
         VALUES (3, 3, 'Test_Manager', '$2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a', 'Jonas', 'Laurente', 'Active', 1, 0)`
      );
      console.log('   ✅ Inserted manager 3: Jonas Laurente');
    } else {
      await connection.execute(
        `UPDATE business_manager SET first_name = 'Jonas', last_name = 'Laurente', is_encrypted = 0,
         encrypted_first_name = NULL, encrypted_last_name = NULL, encrypted_email = NULL, encrypted_contact = NULL
         WHERE business_manager_id = 3`
      );
      console.log('   ✅ Updated manager 3: Jonas Laurente');
    }

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL VERIFICATION:');
    console.log('='.repeat(50));

    const [mgrCheck] = await connection.execute('SELECT business_manager_id, first_name, last_name, email FROM business_manager ORDER BY business_manager_id');
    console.log('\n📋 Business Managers:');
    mgrCheck.forEach(m => console.log(`   ${m.business_manager_id}: ${m.first_name} ${m.last_name} - ${m.email || 'N/A'}`));

    const [empCheck] = await connection.execute('SELECT business_employee_id, first_name, last_name, email FROM business_employee ORDER BY business_employee_id');
    console.log('\n👔 Business Employees:');
    empCheck.forEach(e => console.log(`   ${e.business_employee_id}: ${e.first_name} ${e.last_name} - ${e.email}`));

    const [colCheck] = await connection.execute('SELECT collector_id, first_name, last_name, email FROM collector ORDER BY collector_id');
    console.log('\n💰 Collectors:');
    colCheck.forEach(c => console.log(`   ${c.collector_id}: ${c.first_name} ${c.last_name} - ${c.email}`));

    const [insCheck] = await connection.execute('SELECT inspector_id, first_name, last_name, email FROM inspector ORDER BY inspector_id');
    console.log('\n🔍 Inspectors:');
    insCheck.forEach(i => console.log(`   ${i.inspector_id}: ${i.first_name} ${i.last_name} - ${i.email}`));

    const [shCheck] = await connection.execute('SELECT stallholder_id, stallholder_name, email FROM stallholder ORDER BY stallholder_id');
    console.log('\n🏪 Stallholders:');
    shCheck.forEach(s => console.log(`   ${s.stallholder_id}: ${s.stallholder_name} - ${s.email}`));

    console.log('\n✅ ALL ORIGINAL DATA RESTORED!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixRemainingData();
