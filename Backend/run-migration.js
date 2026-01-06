// Run migration script
import mysql from 'mysql2/promise';

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    console.log('🔧 Connected to database');
    
    // Drop existing procedure first
    console.log('📝 Dropping existing procedure...');
    await connection.execute('DROP PROCEDURE IF EXISTS `sp_getAllStalls_complete`');
    
    console.log('📝 Creating updated procedure...');
    
    // Create the procedure with proper collation handling
    const createProcedure = `
CREATE PROCEDURE \`sp_getAllStalls_complete\` (IN \`p_user_id\` INT, IN \`p_user_type\` VARCHAR(50), IN \`p_branch_id\` INT)
BEGIN
    DECLARE v_current_month VARCHAR(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    SET v_current_month = DATE_FORMAT(CURDATE(), '%Y-%m');
    
    IF p_user_type COLLATE utf8mb4_general_ci = 'stall_business_owner' THEN
        
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id IN (
            SELECT DISTINCT bm.branch_id FROM business_owner_managers bom
            INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
            WHERE bom.business_owner_id = p_user_id AND bom.status COLLATE utf8mb4_general_ci = 'Active'
        )
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'system_administrator' THEN
        
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'business_manager' THEN
        
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE bm.business_manager_id = p_user_id
        ORDER BY s.created_at DESC;
        
    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'business_employee' THEN
        
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id = p_branch_id
        ORDER BY s.created_at DESC;
        
    ELSE
        SELECT NULL LIMIT 0;
    END IF;
END
`;
    
    await connection.execute(createProcedure);
    console.log('✅ Stored procedure created successfully!');
    
    // Test the stored procedure
    console.log('🧪 Testing stored procedure...');
    const [result] = await connection.execute('CALL sp_getAllStalls_complete(?, ?, ?)', [1, 'business_manager', 1]);
    console.log(`✅ Stored procedure returned ${result[0]?.length || 0} rows`);
    
    if (result[0]?.length > 0) {
      console.log('📊 Sample result:', {
        stall_no: result[0][0].stall_no,
        stallholder_name: result[0][0].stallholder_name,
        availability_status: result[0][0].availability_status,
        rental_paid_current_month: result[0][0].rental_paid_current_month
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
