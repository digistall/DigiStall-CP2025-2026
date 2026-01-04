import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naga_stall'
    });

    console.log('=== INSPECTOR TABLE ===');
    const [inspectorCols] = await connection.query('SHOW COLUMNS FROM inspector');
    inspectorCols.forEach(c => console.log(c.Field, ':', c.Type));

    console.log('\n=== COLLECTOR TABLE ===');
    const [collectorCols] = await connection.query('SHOW COLUMNS FROM collector');
    collectorCols.forEach(c => console.log(c.Field, ':', c.Type));

    console.log('\n=== INS1731 Data ===');
    const [ins] = await connection.query("SELECT inspector_id, username, password, status FROM inspector WHERE username = 'INS1731'");
    console.log(ins[0]);

    console.log('\n=== COL6806 Data ===');
    const [col] = await connection.query("SELECT collector_id, username, password_hash, status FROM collector WHERE username = 'COL6806'");
    console.log(col[0]);

    await connection.end();
}

checkColumns().catch(console.error);
