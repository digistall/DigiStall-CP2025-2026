import mysql from 'mysql2/promise';

async function restoreRealData() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 RESTORING YOUR REAL DATA...\n');
    console.log('Please provide the correct data for each record.\n');

    // ============================================
    // CURRENT STATE
    // ============================================
    console.log('='.repeat(60));
    console.log('📊 CURRENT DATABASE STATE:');
    console.log('='.repeat(60));

    const [mgrCheck] = await connection.execute('SELECT business_manager_id, first_name, last_name, email, contact_number FROM business_manager ORDER BY business_manager_id');
    console.log('\n📋 Business Managers:');
    console.table(mgrCheck);

    const [empCheck] = await connection.execute('SELECT business_employee_id, first_name, last_name, email, phone_number FROM business_employee ORDER BY business_employee_id');
    console.log('\n👔 Business Employees:');
    console.table(empCheck);

    const [colCheck] = await connection.execute('SELECT collector_id, first_name, last_name, email, contact_no FROM collector ORDER BY collector_id');
    console.log('\n💰 Collectors:');
    console.table(colCheck);

    const [insCheck] = await connection.execute('SELECT inspector_id, first_name, last_name, email, contact_no FROM inspector ORDER BY inspector_id');
    console.log('\n🔍 Inspectors:');
    console.table(insCheck);

    const [shCheck] = await connection.execute('SELECT stallholder_id, stallholder_name, email, contact_number, address FROM stallholder ORDER BY stallholder_id');
    console.log('\n🏪 Stallholders:');
    console.table(shCheck);

    console.log('\n' + '='.repeat(60));
    console.log('📝 PLEASE PROVIDE THE CORRECT DATA');
    console.log('='.repeat(60));
    console.log(`
Based on what you told me, the REAL data should be:

COLLECTORS:
  - Guiseppe Archivido (what ID? email? contact?)

INSPECTORS:  
  - Shimri Lu (what ID? full name? email? contact?)

STALLHOLDERS:
  - Voun Irish Florence Dejumo (what ID? email? contact? address?)
  - Shimri Luansing (what ID? email? contact? address?)

Please tell me:
1. The EXACT names for each person
2. Their email addresses
3. Their contact numbers
4. For stallholders: their addresses
5. What IDs they should have (or if I should add them as new records)

I will then create a script to restore this data correctly.
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

restoreRealData();
