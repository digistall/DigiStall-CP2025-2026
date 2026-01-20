const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

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
    console.log('🔧 FIXING STORED PROCEDURES AND PASSWORDS\n');

    // 1. Fix sp_getFullStallholderInfo - use stall_number instead of stall_no
    console.log('1️⃣ Fixing sp_getFullStallholderInfo (stall_number column)...');
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
          s.stall_number as stall_no,
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
    console.log('✅ sp_getFullStallholderInfo fixed');

    // 2. Fix sp_getLatestApplicationInfo
    console.log('2️⃣ Fixing sp_getLatestApplicationInfo...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getLatestApplicationInfo');
    await conn.query(`
      CREATE PROCEDURE sp_getLatestApplicationInfo(IN p_applicant_id INT)
      BEGIN
        SELECT 
          app.application_id,
          app.stall_id,
          app.application_status as status,
          app.application_date,
          s.stall_number as stall_no,
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
    console.log('✅ sp_getLatestApplicationInfo fixed');

    // 3. Generate simple alphanumeric passwords
    function generateSimplePassword(length = 8) {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // no confusing chars like 0,o,1,l
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }

    // 4. Reset inspector password with bcrypt (simple alphanumeric)
    console.log('\n3️⃣ Resetting inspector password (bcrypt, simple format)...');
    const inspectorPassword = generateSimplePassword(8);
    const inspectorHash = await bcrypt.hash(inspectorPassword, 10);
    
    await conn.query(`
      UPDATE inspector 
      SET password = ?
      WHERE email = 'requiem121701@gmail.com'
    `, [inspectorHash]);
    console.log(`✅ Inspector password: ${inspectorPassword}`);

    // 5. Reset stallholder credential password with bcrypt
    console.log('4️⃣ Resetting stallholder password (bcrypt, simple format)...');
    const stallholderPassword = generateSimplePassword(8);
    const stallholderHash = await bcrypt.hash(stallholderPassword, 10);
    
    await conn.query(`
      UPDATE credential 
      SET password_hash = ?
      WHERE username = 'josonglaurente@gmail.com'
    `, [stallholderHash]);
    console.log(`✅ Stallholder password: ${stallholderPassword}`);

    // 6. Reset collector password if exists
    const [collectors] = await conn.query('SELECT * FROM collector LIMIT 1');
    if (collectors.length > 0) {
      console.log('5️⃣ Resetting collector password...');
      const collectorPassword = generateSimplePassword(8);
      const collectorHash = await bcrypt.hash(collectorPassword, 10);
      await conn.query(`
        UPDATE collector 
        SET password = ?
        WHERE collector_id = ?
      `, [collectorHash, collectors[0].collector_id]);
      console.log(`✅ Collector (${collectors[0].email || 'ID:' + collectors[0].collector_id}) password: ${collectorPassword}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL FIXES COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n📝 NEW LOGIN CREDENTIALS (simple alphanumeric):');
    console.log(`  Stallholder: josonglaurente@gmail.com / ${stallholderPassword}`);
    console.log(`  Inspector:   requiem121701@gmail.com / ${inspectorPassword}`);
    console.log('\n⚠️  SAVE THESE PASSWORDS - they are randomly generated!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
})();
