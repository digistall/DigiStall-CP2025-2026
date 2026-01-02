import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkBusinessEmployee() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naga_stall'
    });

    console.log('=== BUSINESS_EMPLOYEE TABLE COLUMNS ===');
    const [cols] = await connection.query('SHOW COLUMNS FROM business_employee');
    cols.forEach(c => console.log(c.Field, ':', c.Type));

    console.log('\n=== WEB EMPLOYEE DATA ===');
    const [emps] = await connection.query(`
        SELECT business_employee_id, first_name, last_name, last_login, last_logout
        FROM business_employee LIMIT 5
    `);
    emps.forEach(e => console.log(e));

    console.log('\n=== EMPLOYEE_SESSION DATA ===');
    const [sessions] = await connection.query(`
        SELECT session_id, business_employee_id, is_active, login_time, last_activity, logout_time
        FROM employee_session ORDER BY session_id DESC LIMIT 10
    `);
    sessions.forEach(s => console.log(s));

    console.log('\n=== STAFF_SESSION DATA ===');
    const [staffSessions] = await connection.query(`
        SELECT session_id, staff_id, staff_type, is_active, login_time, last_activity, logout_time
        FROM staff_session ORDER BY session_id DESC LIMIT 10
    `);
    staffSessions.forEach(s => console.log(s));

    await connection.end();
}

checkBusinessEmployee().catch(console.error);
