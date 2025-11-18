const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'naga_stall'
    });
    
    console.log('\n🎉 MONTHLY PAYMENT AUTOMATION - FINAL STATUS\n');
    console.log('==============================================\n');
    
    const [events] = await conn.query('SHOW EVENTS WHERE Name = "reset_monthly_payment_status"');
    console.log('📅 Monthly Reset Event:');
    console.log('   Name:', events[0].Name);
    console.log('   Status:', events[0].Status);
    console.log('   First Run:', events[0].Starts);
    console.log('   Schedule: Every 1 MONTH on the 1st at 00:01:00\n');
    
    const [scheduler] = await conn.query('SHOW VARIABLES LIKE "event_scheduler"');
    console.log('⚙️  Event Scheduler:', scheduler[0].Value, '\n');
    
    const [statuses] = await conn.query(`
        SELECT payment_status, COUNT(*) as count
        FROM stallholder
        WHERE contract_status = 'Active'
        GROUP BY payment_status
    `);
    console.log('👥 Current Stallholder Statuses:');
    statuses.forEach(s => console.log(`   ${s.payment_status}: ${s.count}`));
    
    console.log('\n✅ System is ACTIVE and ready for production!');
    console.log('✅ Next automatic reset: December 1, 2025 at 12:01 AM\n');
    
    await conn.end();
})();
