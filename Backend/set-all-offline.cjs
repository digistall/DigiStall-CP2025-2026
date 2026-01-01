const mysql = require('mysql2/promise');

async function setAllEmployeesOffline() {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('Connected to database...\n');
  
  // Get Philippine time
  const now = new Date();
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = phTime.getFullYear();
  const month = String(phTime.getMonth() + 1).padStart(2, '0');
  const day = String(phTime.getDate()).padStart(2, '0');
  const hours = String(phTime.getHours()).padStart(2, '0');
  const minutes = String(phTime.getMinutes()).padStart(2, '0');
  const seconds = String(phTime.getSeconds()).padStart(2, '0');
  const philippineTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
  console.log(`Setting last_logout to: ${philippineTime}\n`);
  
  // Update all business_employees
  console.log('Updating business_employee...');
  const [beResult] = await conn.query(
    'UPDATE business_employee SET last_logout = ? WHERE last_logout IS NULL OR last_logout < last_login',
    [philippineTime]
  );
  console.log(`  ✅ Updated ${beResult.affectedRows} business employees\n`);
  
  // Update all inspectors
  console.log('Updating inspector...');
  const [insResult] = await conn.query(
    'UPDATE inspector SET last_logout = ? WHERE last_logout IS NULL OR last_logout < last_login',
    [philippineTime]
  );
  console.log(`  ✅ Updated ${insResult.affectedRows} inspectors\n`);
  
  // Update all collectors
  console.log('Updating collector...');
  const [colResult] = await conn.query(
    'UPDATE collector SET last_logout = ? WHERE last_logout IS NULL OR last_logout < last_login',
    [philippineTime]
  );
  console.log(`  ✅ Updated ${colResult.affectedRows} collectors\n`);
  
  // Update business_manager
  console.log('Updating business_manager...');
  const [bmResult] = await conn.query(
    'UPDATE business_manager SET last_logout = ? WHERE last_logout IS NULL OR last_logout < last_login',
    [philippineTime]
  );
  console.log(`  ✅ Updated ${bmResult.affectedRows} business managers\n`);
  
  // Update system_administrator (no last_login column in this table)
  console.log('Updating system_administrator...');
  const [saResult] = await conn.query(
    'UPDATE system_administrator SET last_logout = ? WHERE last_logout IS NULL',
    [philippineTime]
  );
  console.log(`  ✅ Updated ${saResult.affectedRows} system administrators\n`);
  
  // Verify the updates
  console.log('=== Verification ===');
  const [inspectors] = await conn.query('SELECT inspector_id, first_name, last_name, last_login, last_logout FROM inspector LIMIT 5');
  console.log('\nInspectors (sample):');
  inspectors.forEach(i => {
    console.log(`  ${i.first_name} ${i.last_name}: login=${i.last_login}, logout=${i.last_logout}`);
  });
  
  const [collectors] = await conn.query('SELECT collector_id, first_name, last_name, last_login, last_logout FROM collector LIMIT 5');
  console.log('\nCollectors (sample):');
  collectors.forEach(c => {
    console.log(`  ${c.first_name} ${c.last_name}: login=${c.last_login}, logout=${c.last_logout}`);
  });
  
  await conn.end();
  console.log('\n✅ All employees set to offline!');
}

setAllEmployeesOffline().catch(console.error);
