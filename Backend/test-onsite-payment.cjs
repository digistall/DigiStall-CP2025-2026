const mysql = require('mysql2/promise');

async function testOnsitePayment() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'naga_stall'
        });

        console.log('✅ Connected to MySQL database\n');

        // Get Elena Reyes (overdue stallholder)
        console.log('📊 Testing with Elena Reyes (overdue stallholder)...\n');
        
        const [beforePayment] = await connection.query(`
            SELECT 
                stallholder_id,
                stallholder_name,
                monthly_rent,
                payment_status,
                last_payment_date,
                DATEDIFF(CURDATE(), last_payment_date) as days_since_last_payment
            FROM stallholder 
            WHERE stallholder_id = 15
        `);
        
        if (beforePayment.length > 0) {
            const sh = beforePayment[0];
            console.log('📋 BEFORE Payment:');
            console.log(`  Name: ${sh.stallholder_name}`);
            console.log(`  Monthly Rent: ₱${sh.monthly_rent}`);
            console.log(`  Payment Status: ${sh.payment_status}`);
            console.log(`  Last Payment: ${sh.last_payment_date}`);
            console.log(`  Days Since Last Payment: ${sh.days_since_last_payment}`);
            
            // Calculate expected late fee
            const monthsOverdue = Math.ceil(sh.days_since_last_payment / 30) - 1;
            const expectedLateFee = monthsOverdue > 0 ? monthsOverdue * 100 : 0;
            console.log(`  Expected Late Fee: ₱${expectedLateFee} (${monthsOverdue} months overdue)\n`);
            
            // Make a test payment
            console.log('💳 Making test payment...');
            const testAmount = parseFloat(sh.monthly_rent) + expectedLateFee;
            
            const [result] = await connection.query(`
                CALL addOnsitePayment(
                    15,
                    ${testAmount},
                    CURDATE(),
                    CURTIME(),
                    DATE_FORMAT(CURDATE(), '%Y-%m'),
                    'rental',
                    'RCP-TEST-ELENA-001',
                    'Test Collector',
                    'Test payment for Elena Reyes',
                    1,
                    1
                )
            `);
            
            if (result[0] && result[0][0]) {
                const paymentResult = result[0][0];
                console.log('\n✅ Payment Result:');
                console.log(`  Success: ${paymentResult.success ? 'Yes' : 'No'}`);
                console.log(`  Message: ${paymentResult.message}`);
                console.log(`  Payment ID: ${paymentResult.payment_id}`);
                console.log(`  Amount Paid: ₱${paymentResult.amount_paid}`);
                console.log(`  Late Fee: ₱${paymentResult.late_fee || 0}`);
                console.log(`  Days Overdue: ${paymentResult.days_overdue || 0}`);
                console.log(`  Receipt: ${paymentResult.receipt_number}`);
            }
            
            // Check stallholder status after payment
            const [afterPayment] = await connection.query(`
                SELECT 
                    stallholder_name,
                    payment_status,
                    last_payment_date
                FROM stallholder 
                WHERE stallholder_id = 15
            `);
            
            if (afterPayment.length > 0) {
                const shAfter = afterPayment[0];
                console.log('\n📋 AFTER Payment:');
                console.log(`  Name: ${shAfter.stallholder_name}`);
                console.log(`  Payment Status: ${shAfter.payment_status}`);
                console.log(`  Last Payment: ${shAfter.last_payment_date}`);
            }
            
            // Show the payment record
            const [payment] = await connection.query(`
                SELECT 
                    payment_id,
                    amount,
                    payment_date,
                    reference_number,
                    payment_status,
                    notes
                FROM payments 
                WHERE reference_number = 'RCP-TEST-ELENA-001'
            `);
            
            if (payment.length > 0) {
                const p = payment[0];
                console.log('\n💰 Payment Record:');
                console.log(`  ID: ${p.payment_id}`);
                console.log(`  Amount: ₱${p.amount}`);
                console.log(`  Date: ${p.payment_date}`);
                console.log(`  Status: ${p.payment_status}`);
                console.log(`  Notes: ${p.notes}`);
            }
        }

        console.log('\n✅ Test completed successfully!');
        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testOnsitePayment();
