import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Encryption configuration (same as in encryptionService.js)
const ENCRYPTION_KEY = 'DigiStall2025SecureKeyForEncryption123';
const SALT = 'digistall-salt';
const ALGORITHM = 'aes-256-gcm';

// Derive key from password
function deriveKey() {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 100000, 32, 'sha256');
}

// Encrypt a value - returns IV:AuthTag:CipherText format
function encrypt(text) {
  if (!text) return null;
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function restoreOriginalData() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 RESTORING ORIGINAL DATA FROM SQL BACKUP...\n');

    // ============================================
    // 1. RESTORE BUSINESS MANAGER DATA
    // ============================================
    console.log('1️⃣ Restoring Business Managers...');
    
    const managers = [
      { id: 1, first_name: 'Juan', last_name: 'Dela Cruz', email: 'NCPM@gmail.com', contact_number: '+63917111111' },
      { id: 2, first_name: 'Zed', last_name: 'Shadows', email: 'zed.shadows@example.com', contact_number: '+63919333333' },
      { id: 3, first_name: 'Jonas', last_name: 'Laurente', email: null, contact_number: null }
    ];

    for (const mgr of managers) {
      // Check if record exists
      const [existing] = await connection.execute(
        'SELECT business_manager_id FROM business_manager WHERE business_manager_id = ?',
        [mgr.id]
      );
      
      if (existing.length > 0) {
        await connection.execute(
          `UPDATE business_manager SET 
            first_name = ?, last_name = ?, email = ?, contact_number = ?,
            encrypted_first_name = NULL, encrypted_last_name = NULL, 
            encrypted_email = NULL, encrypted_contact = NULL, is_encrypted = 0
          WHERE business_manager_id = ?`,
          [mgr.first_name, mgr.last_name, mgr.email, mgr.contact_number, mgr.id]
        );
        console.log(`   ✅ Updated manager ${mgr.id}: ${mgr.first_name} ${mgr.last_name}`);
      }
    }

    // ============================================
    // 2. RESTORE BUSINESS EMPLOYEE DATA
    // ============================================
    console.log('\n2️⃣ Restoring Business Employees...');
    
    const employees = [
      { id: 1, first_name: 'Voun Irish', last_name: 'Dejumo', email: 'awfullumos@gmail.com', phone_number: '09876543212' },
      { id: 2, first_name: 'Jeno Aldrei', last_name: 'Laurente', email: 'laurentejenoaldrei@gmail.com', phone_number: '09876543212' }
    ];

    for (const emp of employees) {
      const [existing] = await connection.execute(
        'SELECT business_employee_id FROM business_employee WHERE business_employee_id = ?',
        [emp.id]
      );
      
      if (existing.length > 0) {
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
    // 3. RESTORE COLLECTOR DATA  
    // ============================================
    console.log('\n3️⃣ Restoring Collectors...');
    
    const collectors = [
      { id: 1, first_name: 'Jeno Aldrei', last_name: 'Laurente', email: 'laurentejeno73@gmail.com', contact_no: '09473430196' }
    ];

    for (const col of collectors) {
      const [existing] = await connection.execute(
        'SELECT collector_id FROM collector WHERE collector_id = ?',
        [col.id]
      );
      
      if (existing.length > 0) {
        await connection.execute(
          `UPDATE collector SET 
            first_name = ?, last_name = ?, email = ?, contact_no = ?,
            encrypted_first_name = NULL, encrypted_last_name = NULL, 
            encrypted_email = NULL, encrypted_contact = NULL, is_encrypted = 0
          WHERE collector_id = ?`,
          [col.first_name, col.last_name, col.email, col.contact_no, col.id]
        );
        console.log(`   ✅ Updated collector ${col.id}: ${col.first_name} ${col.last_name}`);
      }
    }

    // Delete fake collectors (IDs 4, 5, 6 were created by my bad script)
    console.log('   🗑️ Removing fake collector records...');
    await connection.execute('DELETE FROM collector WHERE collector_id IN (4, 5, 6)');
    console.log('   ✅ Removed fake collectors');

    // ============================================
    // 4. RESTORE INSPECTOR DATA
    // ============================================
    console.log('\n4️⃣ Restoring Inspectors...');
    
    const inspectors = [
      { id: 4, first_name: 'Voun Irish', last_name: 'Dejumo', email: 'josonglaurente@gmail.com', contact_no: '09473595468' }
    ];

    for (const ins of inspectors) {
      const [existing] = await connection.execute(
        'SELECT inspector_id FROM inspector WHERE inspector_id = ?',
        [ins.id]
      );
      
      if (existing.length > 0) {
        await connection.execute(
          `UPDATE inspector SET 
            first_name = ?, last_name = ?, email = ?, contact_no = ?,
            encrypted_first_name = NULL, encrypted_last_name = NULL, 
            encrypted_email = NULL, encrypted_contact = NULL, is_encrypted = 0
          WHERE inspector_id = ?`,
          [ins.first_name, ins.last_name, ins.email, ins.contact_no, ins.id]
        );
        console.log(`   ✅ Updated inspector ${ins.id}: ${ins.first_name} ${ins.last_name}`);
      }
    }

    // Delete fake inspectors (IDs 5, 6 were created by my bad script)
    console.log('   🗑️ Removing fake inspector records...');
    await connection.execute('DELETE FROM inspector WHERE inspector_id IN (5, 6)');
    console.log('   ✅ Removed fake inspectors');

    // ============================================
    // 5. RESTORE STALLHOLDER DATA
    // ============================================
    console.log('\n5️⃣ Restoring Stallholders...');
    
    const stallholders = [
      { id: 1, stallholder_name: 'Jeno Aldrei Laurente', contact_number: '09473430196', email: 'laurentejeno73@gmail.com', address: 'Zone 5' }
    ];

    for (const sh of stallholders) {
      const [existing] = await connection.execute(
        'SELECT stallholder_id FROM stallholder WHERE stallholder_id = ?',
        [sh.id]
      );
      
      if (existing.length > 0) {
        await connection.execute(
          `UPDATE stallholder SET 
            stallholder_name = ?, contact_number = ?, email = ?, address = ?,
            encrypted_name = NULL, encrypted_email = NULL, 
            encrypted_contact = NULL, encrypted_address = NULL, is_encrypted = 0
          WHERE stallholder_id = ?`,
          [sh.stallholder_name, sh.contact_number, sh.email, sh.address, sh.id]
        );
        console.log(`   ✅ Updated stallholder ${sh.id}: ${sh.stallholder_name}`);
      }
    }

    // Delete fake stallholders (IDs 2, 7 were created by my bad script)
    console.log('   🗑️ Removing fake stallholder records...');
    await connection.execute('DELETE FROM stallholder WHERE stallholder_id IN (2, 7)');
    console.log('   ✅ Removed fake stallholders');

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 VERIFICATION - Current Data:');
    console.log('='.repeat(50));

    const [mgrCheck] = await connection.execute('SELECT business_manager_id, first_name, last_name, email FROM business_manager');
    console.log('\nBusiness Managers:');
    mgrCheck.forEach(m => console.log(`  ${m.business_manager_id}: ${m.first_name} ${m.last_name} - ${m.email}`));

    const [empCheck] = await connection.execute('SELECT business_employee_id, first_name, last_name, email FROM business_employee');
    console.log('\nBusiness Employees:');
    empCheck.forEach(e => console.log(`  ${e.business_employee_id}: ${e.first_name} ${e.last_name} - ${e.email}`));

    const [colCheck] = await connection.execute('SELECT collector_id, first_name, last_name, email FROM collector');
    console.log('\nCollectors:');
    colCheck.forEach(c => console.log(`  ${c.collector_id}: ${c.first_name} ${c.last_name} - ${c.email}`));

    const [insCheck] = await connection.execute('SELECT inspector_id, first_name, last_name, email FROM inspector');
    console.log('\nInspectors:');
    insCheck.forEach(i => console.log(`  ${i.inspector_id}: ${i.first_name} ${i.last_name} - ${i.email}`));

    const [shCheck] = await connection.execute('SELECT stallholder_id, stallholder_name, email FROM stallholder');
    console.log('\nStallholders:');
    shCheck.forEach(s => console.log(`  ${s.stallholder_id}: ${s.stallholder_name} - ${s.email}`));

    console.log('\n✅ ORIGINAL DATA RESTORED SUCCESSFULLY!');
    console.log('\n⚠️ Data is currently in PLAIN TEXT format.');
    console.log('   Run encryption if needed after verifying the data is correct.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

restoreOriginalData();
