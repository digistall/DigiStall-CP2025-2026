const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall',
    multipleStatements: true
};

async function applyMonthlyPaymentAutomation() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to naga_stall database\n');
        
        console.log('📄 Applying monthly payment automation migration...\n');
        
        // STEP 1: Alter stallholder table payment_status enum
        console.log('1️⃣  Updating stallholder payment_status enum...');
        await connection.query(`
            ALTER TABLE stallholder 
            MODIFY COLUMN payment_status ENUM(
                'current',
                'overdue', 
                'grace_period',
                'paid',
                'pending'
            ) DEFAULT 'pending'
        `);
        console.log('   ✅ Enum updated with "paid" and "pending" statuses\n');
        
        // STEP 2: Update addOnsitePayment procedure
        console.log('2️⃣  Updating addOnsitePayment procedure...');
        await connection.query(`DROP PROCEDURE IF EXISTS addOnsitePayment`);
        
        await connection.query(`
            CREATE PROCEDURE addOnsitePayment (
                IN p_stallholder_id INT,
                IN p_amount DECIMAL(10,2),
                IN p_payment_date DATE,
                IN p_payment_time TIME,
                IN p_payment_for_month VARCHAR(7),
                IN p_payment_type VARCHAR(50),
                IN p_reference_number VARCHAR(100),
                IN p_collected_by VARCHAR(100),
                IN p_notes TEXT,
                IN p_branch_id INT,
                IN p_created_by INT
            )
            BEGIN
                DECLARE payment_id INT;
                DECLARE v_days_overdue INT DEFAULT 0;
                DECLARE v_late_fee DECIMAL(10,2) DEFAULT 0.00;
                DECLARE v_last_payment_date DATE;
                DECLARE v_monthly_rent DECIMAL(10,2);
                DECLARE v_total_amount DECIMAL(10,2);
                DECLARE v_notes TEXT;
                
                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    SELECT 0 as success, 'Payment processing failed' as message;
                END;
                
                START TRANSACTION;
                
                SELECT last_payment_date, monthly_rent
                INTO v_last_payment_date, v_monthly_rent
                FROM stallholder
                WHERE stallholder_id = p_stallholder_id;
                
                IF v_last_payment_date IS NOT NULL THEN
                    SET v_days_overdue = DATEDIFF(p_payment_date, v_last_payment_date) - 30;
                    IF v_days_overdue < 0 THEN
                        SET v_days_overdue = 0;
                    END IF;
                END IF;
                
                IF v_days_overdue > 0 THEN
                    SET v_late_fee = CEILING(v_days_overdue / 30) * 100.00;
                END IF;
                
                SET v_total_amount = p_amount + v_late_fee;
                
                SET v_notes = p_notes;
                IF v_late_fee > 0 THEN
                    SET v_notes = CONCAT(
                        COALESCE(p_notes, ''),
                        IF(p_notes IS NOT NULL AND p_notes != '', ' | ', ''),
                        'Late Fee: ₱', FORMAT(v_late_fee, 2),
                        ' (', v_days_overdue, ' days overdue)'
                    );
                END IF;
                
                INSERT INTO payments (
                    stallholder_id, amount, payment_date, payment_time, payment_for_month,
                    payment_type, payment_method, reference_number, collected_by, notes,
                    payment_status, branch_id, created_by, created_at, updated_at
                ) VALUES (
                    p_stallholder_id, v_total_amount, p_payment_date, p_payment_time, p_payment_for_month,
                    p_payment_type, 'onsite', p_reference_number, p_collected_by, v_notes,
                    'completed', p_branch_id, p_created_by, NOW(), NOW()
                );
                
                SET payment_id = LAST_INSERT_ID();
                
                UPDATE stallholder
                SET last_payment_date = p_payment_date,
                    payment_status = 'paid',
                    updated_at = NOW()
                WHERE stallholder_id = p_stallholder_id;
                
                COMMIT;
                
                SELECT 
                    1 as success,
                    payment_id,
                    v_total_amount as amount_paid,
                    v_late_fee as late_fee,
                    v_days_overdue as days_overdue,
                    'Payment recorded successfully. Stallholder status updated to PAID.' as message;
            END
        `);
        console.log('   ✅ Procedure updated to set status to "paid"\n');
        
        // STEP 3: Update sp_get_all_stallholders
        console.log('3️⃣  Updating sp_get_all_stallholders procedure...');
        await connection.query(`DROP PROCEDURE IF EXISTS sp_get_all_stallholders`);
        
        await connection.query(`
            CREATE PROCEDURE sp_get_all_stallholders (IN p_branch_id INT)
            BEGIN
                SELECT 
                    sh.stallholder_id as id,
                    sh.stallholder_name as name,
                    sh.contact_number as contact,
                    sh.business_name as businessName,
                    COALESCE(st.stall_no, 'N/A') as stallNo,
                    COALESCE(st.stall_location, 'N/A') as stallLocation,
                    COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
                    COALESCE(b.branch_name, 'Unknown') as branchName,
                    sh.payment_status as paymentStatus
                FROM stallholder sh
                LEFT JOIN stall st ON sh.stall_id = st.stall_id
                LEFT JOIN branch b ON sh.branch_id = b.branch_id
                WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
                  AND sh.contract_status = 'Active'
                  AND sh.payment_status != 'paid'
                ORDER BY sh.stallholder_name ASC;
            END
        `);
        console.log('   ✅ Procedure updated to filter out "paid" stallholders\n');
        
        // STEP 4: Create payment_status_log table
        console.log('4️⃣  Creating payment_status_log table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payment_status_log (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                reset_date DATE NOT NULL,
                stallholders_reset_count INT DEFAULT 0,
                reset_type ENUM('manual', 'automatic') DEFAULT 'automatic',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('   ✅ Log table created\n');
        
        // STEP 5: Enable event scheduler
        console.log('5️⃣  Enabling event scheduler...');
        await connection.query(`SET GLOBAL event_scheduler = ON`);
        console.log('   ✅ Event scheduler enabled\n');
        
        // STEP 6: Create monthly reset event
        console.log('6️⃣  Creating monthly reset event...');
        await connection.query(`DROP EVENT IF EXISTS reset_monthly_payment_status`);
        
        await connection.query(`
            CREATE EVENT reset_monthly_payment_status
            ON SCHEDULE 
                EVERY 1 MONTH
                STARTS CONCAT(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m'), '-01 00:01:00')
            ON COMPLETION PRESERVE
            ENABLE
            COMMENT 'Resets stallholder payment status from paid to pending on the 1st of every month'
            DO
            BEGIN
                DECLARE reset_count INT DEFAULT 0;
                
                SELECT COUNT(*) INTO reset_count
                FROM stallholder
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                UPDATE stallholder
                SET payment_status = 'pending',
                    updated_at = NOW()
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                INSERT INTO payment_status_log (
                    reset_date,
                    stallholders_reset_count,
                    reset_type,
                    notes
                ) VALUES (
                    CURDATE(),
                    reset_count,
                    'automatic',
                    CONCAT('Monthly automatic reset on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
                );
            END
        `);
        console.log('   ✅ Monthly reset event created\n');
        
        // STEP 7: Create manual reset procedure
        console.log('7️⃣  Creating manual reset procedure...');
        await connection.query(`DROP PROCEDURE IF EXISTS manual_reset_payment_status`);
        
        await connection.query(`
            CREATE PROCEDURE manual_reset_payment_status()
            BEGIN
                DECLARE reset_count INT DEFAULT 0;
                
                SELECT COUNT(*) INTO reset_count
                FROM stallholder
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                UPDATE stallholder
                SET payment_status = 'pending',
                    updated_at = NOW()
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                INSERT INTO payment_status_log (
                    reset_date,
                    stallholders_reset_count,
                    reset_type,
                    notes
                ) VALUES (
                    CURDATE(),
                    reset_count,
                    'manual',
                    CONCAT('Manual reset by admin on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
                );
                
                SELECT 
                    reset_count as stallholders_reset,
                    'Payment statuses reset from paid to pending' as message;
            END
        `);
        console.log('   ✅ Manual reset procedure created\n');
        
        console.log('✅ Migration completed successfully!\n');
        
        // VERIFICATION
        console.log('📊 VERIFICATION RESULTS:');
        console.log('========================\n');
        
        console.log('1️⃣  Current Payment Status Distribution:');
        const [statusCounts] = await connection.query(`
            SELECT 
                payment_status,
                COUNT(*) as count
            FROM stallholder
            WHERE contract_status = 'Active'
            GROUP BY payment_status
        `);
        console.table(statusCounts);
        
        console.log('\n2️⃣  Monthly Reset Event Status:');
        const [events] = await connection.query(`
            SHOW EVENTS WHERE Name = 'reset_monthly_payment_status'
        `);
        if (events.length > 0) {
            console.log('   ✅ Event "reset_monthly_payment_status" created successfully');
            console.log(`   📅 Starts: ${events[0].Starts}`);
            console.log(`   🔄 Interval: ${events[0].Interval_value} ${events[0].Interval_field}`);
            console.log(`   🟢 Status: ${events[0].Status}`);
        } else {
            console.log('   ❌ Event not found');
        }
        
        console.log('\n3️⃣  Event Scheduler Status:');
        const [scheduler] = await connection.query(`
            SHOW VARIABLES LIKE 'event_scheduler'
        `);
        console.log(`   ${scheduler[0].Value === 'ON' ? '✅' : '❌'} Event Scheduler: ${scheduler[0].Value}`);
        
        console.log('\n4️⃣  Stored Procedures:');
        const [procedures] = await connection.query(`
            SHOW PROCEDURE STATUS WHERE Db = 'naga_stall' 
            AND Name IN ('addOnsitePayment', 'sp_get_all_stallholders', 'manual_reset_payment_status')
        `);
        procedures.forEach(proc => {
            console.log(`   ✅ ${proc.Name}`);
        });
        
        console.log('\n========================');
        console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================\n');
        
        console.log('📋 FEATURE SUMMARY:');
        console.log('• When stallholder pays → status changes to "paid"');
        console.log('• Paid stallholders disappear from dropdown');
        console.log('• On 1st of each month → status auto-resets to "pending"');
        console.log('• Stallholders reappear in dropdown for new month');
        console.log('• Overdue payments get ₱100/month late fee');
        console.log('\n📋 TESTING:');
        console.log('• Test manual reset: CALL manual_reset_payment_status();');
        console.log('• Check reset log: SELECT * FROM payment_status_log;\n');
        
    } catch (error) {
        console.error('❌ Error applying migration:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

applyMonthlyPaymentAutomation();
