/**
 * Run Migration Script
 * Executes the fix_application_auto_increment.sql on DigitalOcean database
 */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runMigration() {
  let connection;
  try {
    console.log('🔗 Connecting to DigitalOcean database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Check current state of application table
    console.log('📋 Checking current application table structure...');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM application WHERE Field = 'application_id'
    `);
    console.log('Current column info:', columns[0]);

    // Run the migration
    console.log('\n🔧 Running migration: Adding AUTO_INCREMENT to application_id...');
    await connection.query(`
      ALTER TABLE application MODIFY application_id int(11) NOT NULL AUTO_INCREMENT
    `);
    console.log('✅ Migration completed successfully!\n');

    // Verify the change
    console.log('📋 Verifying change...');
    const [newColumns] = await connection.query(`
      SHOW COLUMNS FROM application WHERE Field = 'application_id'
    `);
    console.log('Updated column info:', newColumns[0]);

    // Check if AUTO_INCREMENT is now set
    const [tableInfo] = await connection.query(`
      SHOW TABLE STATUS WHERE Name = 'application'
    `);
    console.log('Auto_increment value:', tableInfo[0].Auto_increment);

    console.log('\n🎉 Migration fix_application_auto_increment.sql applied successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('The application_id column may already have AUTO_INCREMENT or the table structure is different.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

runMigration();
