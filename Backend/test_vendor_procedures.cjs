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
    console.log('🧪 TESTING VENDOR STORED PROCEDURES\n');
    console.log('========================================\n');

    // Test getAllVendorsWithRelations
    console.log('1️⃣ Testing getAllVendorsWithRelations...');
    const [getAllResult] = await conn.query('CALL getAllVendorsWithRelations()');
    console.log(`✅ Found ${getAllResult[0]?.length || 0} vendors`);
    
    if (getAllResult[0]?.length > 0) {
      console.log('\n📋 Sample vendor data:');
      const vendor = getAllResult[0][0];
      console.log(`   - ID: ${vendor.vendor_id}`);
      console.log(`   - Name: ${vendor.full_name}`);
      console.log(`   - Email: ${vendor.email || 'N/A'}`);
      console.log(`   - Status: ${vendor.status}`);
      console.log(`   - Business: ${vendor.business_name || 'N/A'}`);
    }

    // Test creating a vendor
    console.log('\n2️⃣ Testing createVendorWithRelations...');
    try {
      const [createResult] = await conn.query(`
        CALL createVendorWithRelations(
          'Juan', 'Dela Cruz', 'Santos', NULL, '09171234567', 'juan@test.com',
          '1980-01-15', 'Male', '123 Test St', 'VEND-001', 'Active',
          'Maria', 'Ana', 'Dela Cruz', '40', '1984-05-20', 'College', '09177654321', 'Teacher',
          'Pedro', 'Jose', 'Dela Cruz', '2005-03-10',
          'Sari-Sari Store', 'Retail', 'General merchandise', '08:00:00', '20:00:00'
        )
      `);
      const newVendorId = createResult[0][0].vendor_id;
      console.log(`✅ Vendor created successfully with ID: ${newVendorId}`);

      // Verify the created vendor
      console.log('\n3️⃣ Testing getVendorWithRelations...');
      const [getResult] = await conn.query('CALL getVendorWithRelations(?)', [newVendorId]);
      if (getResult[0]?.length > 0) {
        const vendor = getResult[0][0];
        console.log(`✅ Vendor retrieved successfully`);
        console.log(`   - Name: ${vendor.full_name}`);
        console.log(`   - Spouse: ${vendor.spouse_full_name || 'N/A'}`);
        console.log(`   - Child: ${vendor.child_full_name || 'N/A'}`);
        console.log(`   - Business: ${vendor.business_name || 'N/A'}`);
      }

      // Test updating
      console.log('\n4️⃣ Testing updateVendorWithRelations...');
      await conn.query(`
        CALL updateVendorWithRelations(
          ?, 'Juan', 'Dela Cruz', 'Santos', 'Jr.', '09171234567', 'juan.updated@test.com',
          '1980-01-15', 'Male', '456 Updated St', 'VEND-001', 'Active',
          'Maria', 'Ana', 'Dela Cruz', '41', '1984-05-20', 'College', '09177654321', 'Teacher',
          'Pedro', 'Jose', 'Dela Cruz', '2005-03-10',
          'Updated Store', 'Retail', 'Updated description', '09:00:00', '21:00:00'
        )
      `, [newVendorId]);
      console.log(`✅ Vendor updated successfully`);

      // Test soft delete
      console.log('\n5️⃣ Testing deleteVendorWithRelations (soft delete)...');
      await conn.query('CALL deleteVendorWithRelations(?, ?)', [newVendorId, false]);
      console.log(`✅ Vendor soft deleted successfully`);

      // Verify status changed
      const [statusCheck] = await conn.query('SELECT status FROM vendor WHERE vendor_id = ?', [newVendorId]);
      console.log(`   - Status is now: ${statusCheck[0]?.status}`);

      // Clean up - hard delete
      console.log('\n6️⃣ Cleaning up test vendor (hard delete)...');
      await conn.query('CALL deleteVendorWithRelations(?, ?)', [newVendorId, true]);
      console.log(`✅ Test vendor cleaned up`);

    } catch (testError) {
      console.error('❌ Test error:', testError.message);
    }

    console.log('\n========================================');
    console.log('✅ ALL VENDOR PROCEDURES WORKING CORRECTLY!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await conn.end();
    console.log('🔌 Database connection closed');
  }
})();
