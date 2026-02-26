import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
  
  try {
    const spSource = `
CREATE PROCEDURE sp_getAllStaffActivities(
    IN p_branchId INT,
    IN p_staffType VARCHAR(50),
    IN p_staffId INT,
    IN p_startDate DATE,
    IN p_endDate DATE,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        l.log_id,
        l.user_type AS staff_type,
        l.user_id AS staff_id,
        COALESCE(
            l.staff_name,
            CONCAT(e.first_name, ' ', e.last_name),
            'Unknown'
        ) AS staff_name, 
        l.branch_id,
        l.action_type,
        l.action_description,
        l.target_type AS module,
        l.ip_address,
        l.user_agent,
        l.status,
        l.created_at
    FROM staff_activity_log l
    LEFT JOIN employees e ON l.user_id = e.id AND (l.user_type = 'inspector' OR l.user_type = 'collector')
    WHERE 
        (p_branchId IS NULL OR l.branch_id = p_branchId OR l.branch_id IS NULL)
    AND (p_staffType IS NULL OR l.user_type = p_staffType)
    AND (p_staffId IS NULL OR l.user_id = p_staffId)
    AND (p_startDate IS NULL OR DATE(l.created_at) >= p_startDate)
    AND (p_endDate IS NULL OR DATE(l.created_at) <= p_endDate)
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
`;
    
    console.log('Dropping existing procedure...');
    await pool.query('DROP PROCEDURE IF EXISTS sp_getAllStaffActivities;');
    
    console.log('Creating sp_getAllStaffActivities with LEFT JOIN...');
    await pool.query(spSource);
    
    console.log('Testing the new SP...');
    const [spRows] = await pool.execute(
        'CALL sp_getAllStaffActivities(?, ?, ?, ?, ?, ?, ?)',
        [null, null, null, null, null, 5, 0] // branchId=null to get all
    );
    console.log("Sample records:");
    console.log(spRows[0]);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
