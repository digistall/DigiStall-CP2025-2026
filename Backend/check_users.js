const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'naga_stall'
    });

    console.log('📋 All users in credential table:');
    const [rows] = await connection.execute('SELECT registrationid, user_name, applicant_id, is_active FROM credential');
    rows.forEach(row => {
        console.log(`   👤 Username: ${row.user_name}, Applicant ID: ${row.applicant_id}, Active: ${row.is_active}`);
    });

    console.log('\n📋 All applicants with their basic info:');
    const [applicants] = await connection.execute('SELECT applicant_id, applicant_full_name FROM applicant ORDER BY applicant_id');
    applicants.forEach(app => {
        console.log(`   🙋 ID: ${app.applicant_id}, Name: ${app.applicant_full_name}`);
    });

    await connection.end();
}

checkUsers().catch(console.error);