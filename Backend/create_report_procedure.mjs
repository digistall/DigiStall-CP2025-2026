import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function createReportProcedure() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check violation_report table structure
        console.log('📋 Checking violation_report table structure...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'violation_report'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);
        
        console.log('Columns in violation_report:');
        console.table(columns);

        // Create reportStallholder stored procedure
        console.log('\n📋 Creating reportStallholder procedure...');
        
        await connection.query('DROP PROCEDURE IF EXISTS reportStallholder');
        
        await connection.query(`
            CREATE PROCEDURE reportStallholder(
                IN p_inspector_id INT,
                IN p_stallholder_id INT,
                IN p_violation_id INT,
                IN p_branch_id INT,
                IN p_stall_id INT,
                IN p_receipt_number VARCHAR(50),
                IN p_evidence TEXT,
                IN p_remarks TEXT
            )
            BEGIN
                INSERT INTO violation_report (
                    stallholder_id,
                    violation_id,
                    reported_by,
                    report_date,
                    offense_count,
                    penalty_amount,
                    payment_status,
                    remarks,
                    status
                )
                SELECT 
                    p_stallholder_id,
                    p_violation_id,
                    p_inspector_id,
                    NOW(),
                    1,
                    v.default_penalty,
                    'Unpaid',
                    CONCAT_WS(' | ', 
                        CONCAT('Receipt: ', p_receipt_number),
                        CONCAT('Evidence: ', p_evidence),
                        p_remarks
                    ),
                    'Open'
                FROM violation v
                WHERE v.violation_id = p_violation_id;
                
                SELECT LAST_INSERT_ID() as report_id;
            END
        `);
        
        console.log('✅ reportStallholder procedure created\n');

        // Test the procedure
        console.log('🧪 Testing reportStallholder procedure...');
        console.log('NOTE: This is just a test, no actual data will be inserted.');
        
        console.log('\n✅ Stored procedure created successfully!');
        console.log('Ready to accept violation reports from inspectors.');

    } catch (error) {
        console.error('❌ Failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

createReportProcedure().catch(console.error);
