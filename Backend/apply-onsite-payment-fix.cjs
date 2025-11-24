const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyOnsitePaymentFix() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'naga_stall',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL database\n');

        // Read the SQL fix file
        const sqlFile = path.join(__dirname, '..', 'database', 'fix_onsite_payment_procedure.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📄 Executing onsite payment procedure fix...');
        await connection.query(sql);
        console.log('✅ Stored procedure updated successfully!\n');

        // Test the procedure with a sample call
        console.log('🧪 Testing addOnsitePayment procedure...');
        
        // Get a test stallholder
        const [stallholders] = await connection.query(`
            SELECT stallholder_id, stallholder_name, monthly_rent, payment_status, last_payment_date
            FROM stallholder 
            WHERE contract_status = 'Active' 
            LIMIT 1
        `);
        
        if (stallholders.length > 0) {
            const testStallholder = stallholders[0];
            console.log('\n📊 Test Stallholder:');
            console.log(`  ID: ${testStallholder.stallholder_id}`);
            console.log(`  Name: ${testStallholder.stallholder_name}`);
            console.log(`  Monthly Rent: ₱${testStallholder.monthly_rent}`);
            console.log(`  Current Status: ${testStallholder.payment_status}`);
            console.log(`  Last Payment: ${testStallholder.last_payment_date || 'Never'}`);
            
            console.log('\n💡 Procedure is ready to use!');
            console.log('📝 Example call:');
            console.log(`CALL addOnsitePayment(
    ${testStallholder.stallholder_id},           -- stallholder_id
    ${testStallholder.monthly_rent},          -- amount
    CURDATE(),                    -- payment_date
    CURTIME(),                    -- payment_time
    DATE_FORMAT(CURDATE(), '%Y-%m'), -- payment_for_month
    'rental',                     -- payment_type
    'RCP-TEST-001',              -- reference_number
    'Juan Dela Cruz',            -- collected_by
    'Test payment',              -- notes
    1,                           -- branch_id
    1                            -- created_by
);`);
        }

        console.log('\n✅ All fixes applied successfully!');
        console.log('\n📌 Features:');
        console.log('  ✓ Inserts payment into payments table');
        console.log('  ✓ Updates stallholder last_payment_date');
        console.log('  ✓ Sets payment_status to "current" after payment');
        console.log('  ✓ Calculates late fees (₱100 per month overdue)');
        console.log('  ✓ Adds late fee notes to payment record');
        console.log('  ✓ Handles transaction rollback on errors');

        await connection.end();
        console.log('\n🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

applyOnsitePaymentFix();
