const mysql = require('mysql2/promise');

async function testStallLocation() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'naga_stall',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL database\n');

        // Test sp_get_all_stallholders for branch 1
        console.log('🧪 Testing sp_get_all_stallholders(1)...');
        const [stallholders] = await connection.query('CALL sp_get_all_stallholders(1)');
        
        if (stallholders && stallholders[0]) {
            console.log('\n📊 Stallholders with location data:');
            stallholders[0].forEach(sh => {
                console.log(`  - ${sh.name}`);
                console.log(`    Stall No: ${sh.stallNo}`);
                console.log(`    Stall Location: ${sh.stallLocation || 'N/A'}`);
                console.log(`    Monthly Rental: ₱${sh.monthlyRental}`);
                console.log('');
            });
        }

        // Test sp_get_stallholder_details for Elena Reyes (ID 15)
        console.log('\n🧪 Testing sp_get_stallholder_details(15)...');
        const [details] = await connection.query('CALL sp_get_stallholder_details(15)');
        
        if (details && details[0] && details[0][0]) {
            const detail = details[0][0];
            console.log('\n📊 Elena Reyes details:');
            console.log(`  Name: ${detail.name}`);
            console.log(`  Business: ${detail.businessName}`);
            console.log(`  Stall No: ${detail.stallNo}`);
            console.log(`  Stall Location: ${detail.stallLocation || 'N/A'}`);
            console.log(`  Monthly Rental: ₱${detail.monthlyRental}`);
        }

        console.log('\n✅ Test complete!');
        await connection.end();
        console.log('🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testStallLocation();
