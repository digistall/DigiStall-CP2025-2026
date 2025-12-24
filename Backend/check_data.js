import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
};

async function checkData() {
    const conn = await mysql.createConnection(dbConfig);
    
    try {
        // Check inspectors
        console.log('=== INSPECTORS ===');
        const [inspectors] = await conn.query(`
            SELECT 
                i.inspector_id,
                i.username,
                i.first_name,
                i.last_name,
                i.email,
                i.status,
                ia.branch_id,
                b.branch_name
            FROM inspector i 
            LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
            LEFT JOIN branch b ON ia.branch_id = b.branch_id
        `);
        console.log('Total inspectors:', inspectors.length);
        console.log(JSON.stringify(inspectors, null, 2));
        
        // Check staff activity logs
        console.log('\n=== STAFF ACTIVITY LOGS (last 5) ===');
        const [logs] = await conn.query(`
            SELECT log_id, staff_type, staff_name, action_type, module, created_at 
            FROM staff_activity_log 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log('Total recent logs:', logs.length);
        console.log(JSON.stringify(logs, null, 2));
        
        // Check collectors
        console.log('\n=== COLLECTORS ===');
        const [collectors] = await conn.query(`
            SELECT 
                c.collector_id,
                c.username,
                c.first_name,
                c.last_name,
                c.email,
                c.status,
                ca.branch_id,
                b.branch_name
            FROM collector c 
            LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
            LEFT JOIN branch b ON ca.branch_id = b.branch_id
        `);
        console.log('Total collectors:', collectors.length);
        console.log(JSON.stringify(collectors, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await conn.end();
    }
}

checkData();
