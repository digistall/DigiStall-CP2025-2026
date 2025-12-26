import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbConfig = {
  host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: process.env.DB_PORT || 25060,
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function restoreCollector() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if collector exists
    console.log('\n🔍 Checking if collector COL6806 exists...');
    const [existing] = await connection.execute('SELECT * FROM collector WHERE username = ?', ['COL6806']);
    
    if (existing.length > 0) {
      console.log('📋 Collector found:', existing[0]);
      console.log('Status:', existing[0].status);
      
      if (existing[0].status === 'inactive') {
        console.log('\n🔄 Reactivating collector...');
        await connection.execute(
          'UPDATE collector SET status = ?, termination_date = NULL, termination_reason = NULL WHERE username = ?',
          ['active', 'COL6806']
        );
        console.log('✅ Collector reactivated');
      } else {
        console.log('✅ Collector is already active');
      }
    } else {
      console.log('\n➕ Collector not found. Inserting new collector...');
      await connection.execute(`
        INSERT INTO collector (collector_id, username, password, first_name, last_name, middle_name, email, contact_number, created_at, hire_date, status, termination_date, termination_reason, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [1, 'COL6806', '$2a$12$fyruXNao5wSK1v4DarRBLO03o/odeWS/P9Y9X98ml/RbYWTPNqZIK', 'Jeno Aldrei', 'Laurente', null, 'laurentejeno73@gmail.com', '09473430196', '2025-12-09 16:29:10', '2025-12-09', 'active', null, null, '2025-12-18 02:58:34']);
      console.log('✅ Collector inserted');
    }

    // Check collector assignment
    console.log('\n🔍 Checking collector assignment...');
    const [assignments] = await connection.execute(
      'SELECT * FROM collector_assignment WHERE collector_id = ? AND status = ?',
      [1, 'Active']
    );

    if (assignments.length === 0) {
      console.log('➕ No active assignment found. Creating assignment...');
      await connection.execute(`
        INSERT INTO collector_assignment (collector_id, branch_id, status, start_date, end_date, remarks)
        VALUES (?, ?, ?, CURDATE(), NULL, ?)
      `, [1, 1, 'Active', 'Restored after deletion']);
      console.log('✅ Assignment created');
    } else {
      console.log('✅ Active assignment exists:', assignments[0]);
    }

    // Verify
    console.log('\n✅ Final verification:');
    const [final] = await connection.execute(`
      SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.status,
        ca.branch_id,
        ca.status as assignment_status
      FROM collector c
      LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
      WHERE c.username = ?
    `, ['COL6806']);
    
    console.table(final);
    console.log('\n🎉 Collector COL6806 has been restored successfully!');
    console.log('📱 You can now login with username: COL6806');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

restoreCollector();
