import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('🔧 Fixing timezone issue in sp_getActiveSessionsAll...\n');
  
  // Update sp_getActiveSessionsAll to convert UTC to PHT
  await connection.query(`DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll`);
  await connection.query(`
    CREATE PROCEDURE sp_getActiveSessionsAll()
    BEGIN
        SELECT 
            es.session_id,
            es.business_employee_id as user_id,
            'employee' as user_type,
            es.is_active,
            CONVERT_TZ(es.login_time, '+00:00', '+08:00') as login_time,
            CONVERT_TZ(es.last_activity, '+00:00', '+08:00') as last_activity,
            CONVERT_TZ(es.logout_time, '+00:00', '+08:00') as logout_time,
            be.first_name,
            be.last_name,
            be.branch_id,
            be.email,
            b.branch_name
        FROM employee_session es
        INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
        LEFT JOIN branch b ON be.branch_id = b.branch_id
        WHERE es.is_active = 1 
           OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        
        UNION ALL
        
        SELECT 
            ss.session_id,
            ss.staff_id as user_id,
            ss.staff_type as user_type,
            ss.is_active,
            CONVERT_TZ(ss.login_time, '+00:00', '+08:00') as login_time,
            CONVERT_TZ(ss.last_activity, '+00:00', '+08:00') as last_activity,
            CONVERT_TZ(ss.logout_time, '+00:00', '+08:00') as logout_time,
            CASE 
                WHEN ss.staff_type = 'inspector' THEN i.first_name
                ELSE c.first_name
            END as first_name,
            CASE 
                WHEN ss.staff_type = 'inspector' THEN i.last_name
                ELSE c.last_name
            END as last_name,
            CASE 
                WHEN ss.staff_type = 'inspector' THEN ia.branch_id
                ELSE ca.branch_id
            END as branch_id,
            CASE 
                WHEN ss.staff_type = 'inspector' THEN i.email
                ELSE c.email
            END as email,
            b.branch_name
        FROM staff_session ss
        LEFT JOIN inspector i ON ss.staff_id = i.inspector_id AND ss.staff_type = 'inspector'
        LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
        LEFT JOIN collector c ON ss.staff_id = c.collector_id AND ss.staff_type = 'collector'
        LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
        LEFT JOIN branch b ON (ia.branch_id = b.branch_id OR ca.branch_id = b.branch_id)
        WHERE ss.is_active = 1 
           OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        
        ORDER BY last_activity DESC;
    END
  `);
  console.log('✅ Updated sp_getActiveSessionsAll with timezone conversion');
  
  // Also update sp_getActiveSessionsByBranches
  await connection.query(`DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches`);
  await connection.query(`
    CREATE PROCEDURE sp_getActiveSessionsByBranches(
        IN p_branch_ids TEXT
    )
    BEGIN
        SET @sql = CONCAT('
            SELECT 
                es.session_id,
                es.business_employee_id as user_id,
                ''employee'' as user_type,
                es.is_active,
                CONVERT_TZ(es.login_time, ''+00:00'', ''+08:00'') as login_time,
                CONVERT_TZ(es.last_activity, ''+00:00'', ''+08:00'') as last_activity,
                CONVERT_TZ(es.logout_time, ''+00:00'', ''+08:00'') as logout_time,
                be.first_name,
                be.last_name,
                be.branch_id,
                be.email,
                b.branch_name
            FROM employee_session es
            INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
            LEFT JOIN branch b ON be.branch_id = b.branch_id
            WHERE (es.is_active = 1 OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
              AND be.branch_id IN (', p_branch_ids, ')
            
            UNION ALL
            
            SELECT 
                ss.session_id,
                ss.staff_id as user_id,
                ss.staff_type as user_type,
                ss.is_active,
                CONVERT_TZ(ss.login_time, ''+00:00'', ''+08:00'') as login_time,
                CONVERT_TZ(ss.last_activity, ''+00:00'', ''+08:00'') as last_activity,
                CONVERT_TZ(ss.logout_time, ''+00:00'', ''+08:00'') as logout_time,
                CASE 
                    WHEN ss.staff_type = ''inspector'' THEN i.first_name
                    ELSE c.first_name
                END as first_name,
                CASE 
                    WHEN ss.staff_type = ''inspector'' THEN i.last_name
                    ELSE c.last_name
                END as last_name,
                CASE 
                    WHEN ss.staff_type = ''inspector'' THEN ia.branch_id
                    ELSE ca.branch_id
                END as branch_id,
                CASE 
                    WHEN ss.staff_type = ''inspector'' THEN i.email
                    ELSE c.email
                END as email,
                b.branch_name
            FROM staff_session ss
            LEFT JOIN inspector i ON ss.staff_id = i.inspector_id AND ss.staff_type = ''inspector''
            LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = ''Active''
            LEFT JOIN collector c ON ss.staff_id = c.collector_id AND ss.staff_type = ''collector''
            LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = ''Active''
            LEFT JOIN branch b ON (ia.branch_id = b.branch_id OR ca.branch_id = b.branch_id)
            WHERE (ss.is_active = 1 OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
              AND (ia.branch_id IN (', p_branch_ids, ') OR ca.branch_id IN (', p_branch_ids, '))
            
            ORDER BY last_activity DESC
        ');
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END
  `);
  console.log('✅ Updated sp_getActiveSessionsByBranches with timezone conversion');
  
  // Test the results
  console.log('\n📊 Testing sp_getActiveSessionsAll output:');
  const [results] = await connection.query(`CALL sp_getActiveSessionsAll()`);
  if (results[0] && results[0].length > 0) {
    results[0].forEach(r => {
      console.log(`  ${r.first_name} ${r.last_name} (${r.user_type})`);
      console.log(`    login_time: ${r.login_time}`);
      console.log(`    last_activity: ${r.last_activity}`);
      console.log(`    is_active: ${r.is_active}`);
    });
  } else {
    console.log('  No active sessions found');
  }
  
  await connection.end();
  console.log('\n✅ Done! Refresh the dashboard to see correct times.');
})();
