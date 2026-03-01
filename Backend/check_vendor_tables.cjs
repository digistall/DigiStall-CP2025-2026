const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'naga_stall',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('🔍 CHECKING VENDOR TABLE STRUCTURE...\n');

    // Check if vendor table exists
    const [tables] = await conn.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'vendor'
    `);

    if (tables.length === 0) {
      console.log('❌ Vendor table does not exist!');
      console.log('Creating vendor table...\n');
      
      // Create vendor table based on schema
      await conn.query(`
        CREATE TABLE IF NOT EXISTS vendor (
          vendor_id INT AUTO_INCREMENT PRIMARY KEY,
          first_name VARCHAR(100),
          middle_name VARCHAR(100),
          last_name VARCHAR(100),
          suffix VARCHAR(10),
          contact_number VARCHAR(100),
          email VARCHAR(100),
          birthdate DATE,
          gender VARCHAR(10),
          address TEXT,
          civil_status ENUM('Single','Married','Divorced','Widowed'),
          vendor_identifier VARCHAR(45),
          status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
          vendor_spouse_id INT,
          vendor_child_id INT,
          vendor_business_id INT,
          assigned_location_id INT,
          vendor_document_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (assigned_location_id) REFERENCES assigned_location(assigned_location_id) ON UPDATE CASCADE ON DELETE CASCADE,
          FOREIGN KEY (vendor_business_id) REFERENCES vendor_business(vendor_business_id) ON UPDATE CASCADE ON DELETE CASCADE,
          FOREIGN KEY (vendor_child_id) REFERENCES vendor_child(vendor_child_id) ON UPDATE CASCADE ON DELETE CASCADE,
          FOREIGN KEY (vendor_documents_id) REFERENCES vendor_documents(vendor_document_id) ON UPDATE CASCADE ON DELETE CASCADE,
          FOREIGN KEY (vendor_spouse_id) REFERENCES vendor_spouse(vendor_spouse_id) ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Vendor table created');
    } else {
      console.log('✅ Vendor table exists');
    }

    // Get table structure
    const [columns] = await conn.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vendor'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📋 Vendor Table Columns:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.COLUMN_KEY === 'PRI' ? '[PRIMARY KEY]' : ''} ${col.EXTRA}`);
    });

    // Check related tables
    console.log('\n🔗 Checking Related Tables...');
    const relatedTables = ['vendor_spouse', 'vendor_child', 'vendor_business', 'vendor_documents', 'assigned_location'];
    
    for (const table of relatedTables) {
      const [tableCheck] = await conn.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
      `, [table]);
      
      if (tableCheck.length > 0) {
        console.log(`   ✅ ${table} exists`);
      } else {
        console.log(`   ❌ ${table} MISSING!`);
      }
    }

    // Check if assigned_location table exists, if not create it
    const [assignedLocationCheck] = await conn.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'assigned_location'
    `);

    if (assignedLocationCheck.length === 0) {
      console.log('\n📝 Creating assigned_location table...');
      await conn.query(`
        CREATE TABLE IF NOT EXISTS assigned_location (
          assigned_location_id INT AUTO_INCREMENT PRIMARY KEY,
          location_name VARCHAR(100),
          location_type VARCHAR(50),
          assigned_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ assigned_location table created');
    }

    // Test the getAllVendorsWithRelations procedure
    console.log('\n🧪 Testing getAllVendorsWithRelations procedure...');
    try {
      const [result] = await conn.query('CALL getAllVendorsWithRelations()');
      console.log(`✅ Procedure executed successfully. Found ${result[0]?.length || 0} vendors`);
    } catch (procError) {
      console.error('❌ Error testing procedure:', procError.message);
    }

    console.log('\n✅ Vendor table verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await conn.end();
  }
})();
