import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naga_stall'
    });

    console.log('=== APPLICANT TABLE COLUMNS ===');
    const [applCols] = await connection.query('SHOW COLUMNS FROM applicant');
    applCols.forEach(c => console.log(c.Field, ':', c.Type));

    console.log('\n=== CREDENTIAL TABLE COLUMNS ===');
    const [credCols] = await connection.query('SHOW COLUMNS FROM credential');
    credCols.forEach(c => console.log(c.Field, ':', c.Type));

    await connection.end();
}

checkSchema().catch(console.error);
