// Check current database table structure
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function checkAndFix() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('✅ Connected to database');
  
  // Check table structures
  const [inspectorCols] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'inspector'"
  );
  console.log('\n📋 Inspector columns:', inspectorCols.map(c => c.COLUMN_NAME).join(', '));
  
  const [collectorCols] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'collector'"
  );
  console.log('📋 Collector columns:', collectorCols.map(c => c.COLUMN_NAME).join(', '));
  
  const [empCols] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'business_employee'"
  );
  console.log('📋 Business Employee columns:', empCols.map(c => c.COLUMN_NAME).join(', '));
  
  // Now fix the procedures
  console.log('\n🔧 Fixing stored procedures...');
  
  // Fix getInspectorsByBranch
  try {
    await conn.query('DROP PROCEDURE IF EXISTS getInspectorsByBranch');
    await conn.query(`
      CREATE PROCEDURE getInspectorsByBranch(IN p_branch_id INT)
      BEGIN
        SELECT 
          i.inspector_id,
          i.email,
          i.first_name,
          i.last_name,
          i.contact_no,
          i.date_hired,
          i.status,
          i.last_login,
          ia.branch_id,
          b.branch_name
        FROM inspector i
        INNER JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id
        INNER JOIN branch b ON ia.branch_id = b.branch_id
        WHERE ia.branch_id = p_branch_id 
          AND ia.status = 'Active' 
          AND i.status = 'active'
        ORDER BY i.inspector_id DESC;
      END
    `);
    console.log('  ✅ getInspectorsByBranch');
  } catch (e) {
    console.log('  ❌ getInspectorsByBranch:', e.message);
  }
  
  // Fix getAllInspectors
  try {
    await conn.query('DROP PROCEDURE IF EXISTS getAllInspectors');
    await conn.query(`
      CREATE PROCEDURE getAllInspectors()
      BEGIN
        SELECT 
          i.inspector_id,
          i.email,
          i.first_name,
          i.last_name,
          i.contact_no,
          i.date_hired,
          i.status,
          i.last_login,
          ia.branch_id,
          b.branch_name
        FROM inspector i
        LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
        LEFT JOIN branch b ON ia.branch_id = b.branch_id
        WHERE i.status = 'active'
        ORDER BY i.inspector_id DESC;
      END
    `);
    console.log('  ✅ getAllInspectors');
  } catch (e) {
    console.log('  ❌ getAllInspectors:', e.message);
  }
  
  // Fix getCollectorsByBranch
  try {
    await conn.query('DROP PROCEDURE IF EXISTS getCollectorsByBranch');
    await conn.query(`
      CREATE PROCEDURE getCollectorsByBranch(IN p_branch_id INT)
      BEGIN
        SELECT 
          c.collector_id,
          c.email,
          c.first_name,
          c.last_name,
          c.contact_no,
          c.date_hired,
          c.status,
          c.last_login,
          ca.branch_id,
          b.branch_name
        FROM collector c
        INNER JOIN collector_assignment ca ON c.collector_id = ca.collector_id
        INNER JOIN branch b ON ca.branch_id = b.branch_id
        WHERE ca.branch_id = p_branch_id 
          AND ca.status = 'Active' 
          AND c.status = 'active'
        ORDER BY c.collector_id DESC;
      END
    `);
    console.log('  ✅ getCollectorsByBranch');
  } catch (e) {
    console.log('  ❌ getCollectorsByBranch:', e.message);
  }
  
  // Fix getAllCollectors
  try {
    await conn.query('DROP PROCEDURE IF EXISTS getAllCollectors');
    await conn.query(`
      CREATE PROCEDURE getAllCollectors()
      BEGIN
        SELECT 
          c.collector_id,
          c.email,
          c.first_name,
          c.last_name,
          c.contact_no,
          c.date_hired,
          c.status,
          c.last_login,
          ca.branch_id,
          b.branch_name
        FROM collector c
        LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
        LEFT JOIN branch b ON ca.branch_id = b.branch_id
        WHERE c.status = 'active'
        ORDER BY c.collector_id DESC;
      END
    `);
    console.log('  ✅ getAllCollectors');
  } catch (e) {
    console.log('  ❌ getAllCollectors:', e.message);
  }
  
  // Fix createBusinessEmployee
  try {
    await conn.query('DROP PROCEDURE IF EXISTS createBusinessEmployee');
    await conn.query(`
      CREATE PROCEDURE createBusinessEmployee(
        IN p_password VARCHAR(500),
        IN p_first_name VARCHAR(500),
        IN p_last_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_phone_number VARCHAR(500),
        IN p_branch_id INT,
        IN p_created_by INT,
        IN p_permissions JSON
      )
      BEGIN
        INSERT INTO business_employee (
          employee_password,
          first_name,
          last_name,
          email,
          phone_number,
          branch_id,
          business_manager_id,
          permissions,
          status
        ) VALUES (
          p_password,
          p_first_name,
          p_last_name,
          p_email,
          p_phone_number,
          p_branch_id,
          p_created_by,
          p_permissions,
          'Active'
        );
        SELECT LAST_INSERT_ID() AS business_employee_id;
      END
    `);
    console.log('  ✅ createBusinessEmployee');
  } catch (e) {
    console.log('  ❌ createBusinessEmployee:', e.message);
  }
  
  // Fix getAllBusinessEmployees
  try {
    await conn.query('DROP PROCEDURE IF EXISTS getAllBusinessEmployees');
    await conn.query(`
      CREATE PROCEDURE getAllBusinessEmployees(IN p_branch_id INT)
      BEGIN
        SELECT 
          be.business_employee_id,
          be.email,
          be.first_name,
          be.last_name,
          be.phone_number,
          be.status,
          be.permissions,
          be.branch_id,
          be.business_manager_id,
          be.last_login,
          be.created_at,
          be.updated_at,
          b.branch_name
        FROM business_employee be
        LEFT JOIN branch b ON be.branch_id = b.branch_id
        WHERE be.branch_id = p_branch_id
        ORDER BY be.created_at DESC;
      END
    `);
    console.log('  ✅ getAllBusinessEmployees');
  } catch (e) {
    console.log('  ❌ getAllBusinessEmployees:', e.message);
  }
  
  // Fix createInspector
  try {
    await conn.query('DROP PROCEDURE IF EXISTS createInspector');
    await conn.query(`
      CREATE PROCEDURE createInspector(
        IN p_password VARCHAR(500),
        IN p_first_name VARCHAR(500),
        IN p_last_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_contact_no VARCHAR(500),
        IN p_branch_id INT
      )
      BEGIN
        DECLARE new_inspector_id INT;
        
        INSERT INTO inspector (
          password,
          first_name,
          last_name,
          email,
          contact_no,
          date_hired,
          status
        ) VALUES (
          p_password,
          p_first_name,
          p_last_name,
          p_email,
          p_contact_no,
          CURDATE(),
          'active'
        );
        
        SET new_inspector_id = LAST_INSERT_ID();
        
        IF p_branch_id IS NOT NULL THEN
          INSERT INTO inspector_assignment (inspector_id, branch_id, assigned_date, status)
          VALUES (new_inspector_id, p_branch_id, CURDATE(), 'Active');
        END IF;
        
        SELECT new_inspector_id AS inspector_id;
      END
    `);
    console.log('  ✅ createInspector');
  } catch (e) {
    console.log('  ❌ createInspector:', e.message);
  }
  
  // Fix createCollector
  try {
    await conn.query('DROP PROCEDURE IF EXISTS createCollector');
    await conn.query(`
      CREATE PROCEDURE createCollector(
        IN p_password VARCHAR(500),
        IN p_first_name VARCHAR(500),
        IN p_last_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_contact_no VARCHAR(500),
        IN p_branch_id INT
      )
      BEGIN
        DECLARE new_collector_id INT;
        
        INSERT INTO collector (
          password,
          first_name,
          last_name,
          email,
          contact_no,
          date_hired,
          status
        ) VALUES (
          p_password,
          p_first_name,
          p_last_name,
          p_email,
          p_contact_no,
          CURDATE(),
          'active'
        );
        
        SET new_collector_id = LAST_INSERT_ID();
        
        IF p_branch_id IS NOT NULL THEN
          INSERT INTO collector_assignment (collector_id, branch_id, assigned_date, status)
          VALUES (new_collector_id, p_branch_id, CURDATE(), 'Active');
        END IF;
        
        SELECT new_collector_id AS collector_id;
      END
    `);
    console.log('  ✅ createCollector');
  } catch (e) {
    console.log('  ❌ createCollector:', e.message);
  }
  
  console.log('\n✅ All procedures fixed!');
  console.log('🔄 Please restart your backend servers.');
  
  await conn.end();
}

checkAndFix().catch(console.error);
