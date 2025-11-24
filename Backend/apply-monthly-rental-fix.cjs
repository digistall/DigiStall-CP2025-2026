const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function fixMonthlyRentalProcedures() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'naga_stall',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL database');

        // Read the SQL fix file
        const sqlFilePath = path.join(__dirname, '..', 'database', 'fix_monthly_rental_procedures.sql');
        const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

        console.log('📄 Executing SQL fix...');

        // Execute the SQL
        const [results] = await connection.query(sqlContent);

        console.log('✅ Stored procedures updated successfully!');
        
        // Test the fix by calling sp_get_all_stallholders
        console.log('\n🧪 Testing sp_get_all_stallholders(1)...');
        const [stallholders] = await connection.query('CALL sp_get_all_stallholders(1)');
        
        if (stallholders && stallholders[0]) {
            console.log('\n📊 Sample stallholders with monthly rental:');
            stallholders[0].forEach(sh => {
                console.log(`  - ${sh.name}: ₱${sh.monthlyRental} (Status: ${sh.paymentStatus})`);
            });
        }

        // Test sp_get_stallholder_details
        console.log('\n🧪 Testing sp_get_stallholder_details(13)...');
        const [details] = await connection.query('CALL sp_get_stallholder_details(13)');
        
        if (details && details[0] && details[0][0]) {
            const detail = details[0][0];
            console.log('\n📊 Stallholder details:');
            console.log(`  Name: ${detail.name}`);
            console.log(`  Business: ${detail.businessName}`);
            console.log(`  Stall: ${detail.stallNo}`);
            console.log(`  Monthly Rental: ₱${detail.monthlyRental}`);
            console.log(`  Payment Status: ${detail.paymentStatus}`);
        }

        console.log('\n✅ All fixes applied and tested successfully!');
        console.log('\n💡 The monthly rental amounts should now display correctly in the stallholder dropdown.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the fix
fixMonthlyRentalProcedures();
