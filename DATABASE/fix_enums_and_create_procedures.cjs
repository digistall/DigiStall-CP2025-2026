const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    // ============================================================
    // 1. FIX ENUM columns — add 'Removed' to both participant tables
    // ============================================================
    console.log('1. Altering auction_participants ENUM...');
    await connection.query(
      "ALTER TABLE auction_participants MODIFY COLUMN status ENUM('Registered','Winner','Not Selected','Removed') DEFAULT 'Registered'"
    );
    console.log('   ✅ auction_participants.status now includes Removed');

    console.log('2. Altering raffle_participants ENUM...');
    await connection.query(
      "ALTER TABLE raffle_participants MODIFY COLUMN status ENUM('Registered','Winner','Not Selected','Removed') DEFAULT 'Registered'"
    );
    console.log('   ✅ raffle_participants.status now includes Removed');

    // ============================================================
    // 2. CREATE STORED PROCEDURES
    // ============================================================

    // --- sp_finalize_auction_winner ---
    console.log('3. Creating sp_finalize_auction_winner...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_finalize_auction_winner');
    await connection.query(`
      CREATE PROCEDURE sp_finalize_auction_winner(
        IN p_auction_id INT,
        IN p_winner_applicant_id INT,
        IN p_winner_bid_id INT,
        IN p_stall_id INT,
        IN p_branch_id INT,
        IN p_branch_manager_id INT,
        IN p_bid_amount DECIMAL(10,2),
        IN p_applicant_full_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_contact_number VARCHAR(500),
        IN p_address TEXT,
        IN p_application_id INT
      )
      BEGIN
        DECLARE v_stallholder_id INT DEFAULT NULL;
        DECLARE v_stall_count INT DEFAULT 0;

        -- Update auction status to Awarded
        UPDATE auction SET status = 'Awarded' WHERE auction_id = p_auction_id;

        -- Mark winning bid (if bid exists)
        IF p_winner_bid_id IS NOT NULL THEN
          UPDATE auction_bids SET status = 'Winning' WHERE bid_id = p_winner_bid_id;
        END IF;

        -- Mark winner in auction_participants
        UPDATE auction_participants SET status = 'Winner'
        WHERE auction_id = p_auction_id AND applicant_id = p_winner_applicant_id;

        -- Mark non-winners
        UPDATE auction_participants SET status = 'Not Selected'
        WHERE auction_id = p_auction_id AND applicant_id != p_winner_applicant_id;

        -- Update stall: Occupied, not available
        UPDATE stall SET raffle_auction_status = 'Awarded', status = 'Occupied', is_available = 0, updated_at = NOW()
        WHERE stall_id = p_stall_id;

        -- Create auction result record
        INSERT INTO auction_result (auction_id, winner_bid_id, final_amount, awarded_date)
        VALUES (p_auction_id, p_winner_bid_id, IFNULL(p_bid_amount, 0), NOW());

        -- Update application status to Approved (if application exists)
        IF p_application_id IS NOT NULL THEN
          UPDATE application SET application_status = 'Approved', reviewed_by = p_branch_manager_id, reviewed_at = NOW()
          WHERE application_id = p_application_id;
        END IF;

        -- Create stallholder record (if not exists)
        SELECT stallholder_id INTO v_stallholder_id FROM stallholder
        WHERE applicant_id = p_winner_applicant_id AND stall_id = p_stall_id LIMIT 1;

        IF v_stallholder_id IS NULL THEN
          INSERT INTO stallholder (applicant_id, mobile_user_id, full_name, email, contact_number, address, stall_id, branch_id, payment_status, status, compliance_status, move_in_date)
          VALUES (p_winner_applicant_id, p_winner_applicant_id, p_applicant_full_name, p_email, p_contact_number, p_address, p_stall_id, p_branch_id, 'unpaid', 'active', 'Compliant', CURDATE());
        END IF;

        -- Update applicant status to approved
        UPDATE applicant SET status = 'approved', updated_at = NOW() WHERE applicant_id = p_winner_applicant_id;

        -- Reject other pending applications for the same stall
        UPDATE application SET application_status = 'Rejected', updated_at = NOW()
        WHERE stall_id = p_stall_id AND application_status IN ('Pending', 'Under Review')
        AND (p_application_id IS NULL OR application_id != p_application_id);

        -- Log the winner confirmation
        INSERT INTO raffle_auction_log (event_type, event_id, action, performed_by, details)
        VALUES ('Auction', p_auction_id, 'Winner Selected', p_branch_manager_id,
                CONCAT('Winner: ', p_applicant_full_name, ' with bid PHP ', IFNULL(p_bid_amount, 'N/A')));

        -- Auto-remove from other auctions/raffles if at 2 stalls
        SELECT COUNT(*) INTO v_stall_count FROM stallholder
        WHERE (applicant_id = p_winner_applicant_id OR mobile_user_id = p_winner_applicant_id) AND status = 'active';

        IF v_stall_count >= 2 THEN
          UPDATE auction_participants SET status = 'Removed'
          WHERE applicant_id = p_winner_applicant_id AND status = 'Registered' AND auction_id != p_auction_id;

          UPDATE raffle_participants SET status = 'Removed'
          WHERE applicant_id = p_winner_applicant_id AND status = 'Registered';
        END IF;

        SELECT v_stall_count AS new_stall_count;
      END
    `);
    console.log('   ✅ sp_finalize_auction_winner created');

    // --- sp_finalize_raffle_winner ---
    console.log('4. Creating sp_finalize_raffle_winner...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_finalize_raffle_winner');
    await connection.query(`
      CREATE PROCEDURE sp_finalize_raffle_winner(
        IN p_raffle_id INT,
        IN p_winner_participant_id INT,
        IN p_winner_applicant_id INT,
        IN p_stall_id INT,
        IN p_branch_id INT,
        IN p_branch_manager_id INT,
        IN p_ticket_number VARCHAR(50),
        IN p_applicant_full_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_contact_number VARCHAR(500),
        IN p_address TEXT,
        IN p_application_id INT
      )
      BEGIN
        DECLARE v_stallholder_id INT DEFAULT NULL;
        DECLARE v_stall_count INT DEFAULT 0;

        -- Update raffle status to Drawn
        UPDATE raffle SET status = 'Drawn' WHERE raffle_id = p_raffle_id;

        -- Mark winner participant
        UPDATE raffle_participants SET status = 'Winner' WHERE participant_id = p_winner_participant_id;

        -- Mark non-winners
        UPDATE raffle_participants SET status = 'Not Selected'
        WHERE raffle_id = p_raffle_id AND participant_id != p_winner_participant_id;

        -- Update stall: Occupied, not available
        UPDATE stall SET raffle_auction_status = 'Drawn', status = 'Occupied', is_available = 0
        WHERE stall_id = p_stall_id;

        -- Create stallholder record (if not exists)
        SELECT stallholder_id INTO v_stallholder_id FROM stallholder
        WHERE applicant_id = p_winner_applicant_id AND stall_id = p_stall_id LIMIT 1;

        IF v_stallholder_id IS NULL THEN
          INSERT INTO stallholder (applicant_id, mobile_user_id, full_name, email, contact_number, address, stall_id, branch_id, payment_status, status, compliance_status, move_in_date)
          VALUES (p_winner_applicant_id, p_winner_applicant_id, p_applicant_full_name, p_email, p_contact_number, p_address, p_stall_id, p_branch_id, 'unpaid', 'active', 'Compliant', CURDATE());
        END IF;

        -- Update applicant status to approved
        UPDATE applicant SET status = 'approved' WHERE applicant_id = p_winner_applicant_id;

        -- Create raffle result record
        INSERT INTO raffle_result (raffle_id, winner_participant_id, draw_date)
        VALUES (p_raffle_id, p_winner_participant_id, NOW());

        -- Update application status to Approved (if application exists)
        IF p_application_id IS NOT NULL THEN
          UPDATE application SET application_status = 'Approved', reviewed_by = p_branch_manager_id, reviewed_at = NOW()
          WHERE application_id = p_application_id;
        END IF;

        -- Reject other pending applications for this stall
        UPDATE application SET application_status = 'Rejected', reviewed_by = p_branch_manager_id, reviewed_at = NOW()
        WHERE stall_id = p_stall_id AND application_status IN ('Pending', 'Under Review') AND applicant_id != p_winner_applicant_id;

        -- Log the winner selection
        INSERT INTO raffle_auction_log (event_type, event_id, action, performed_by, details)
        VALUES ('Raffle', p_raffle_id, 'Winner Selected', p_branch_manager_id,
                CONCAT('Winner: ', p_applicant_full_name, ' (ticket: ', IFNULL(p_ticket_number, 'N/A'), ')'));

        -- Auto-remove from other auctions/raffles if at 2 stalls
        SELECT COUNT(*) INTO v_stall_count FROM stallholder
        WHERE (applicant_id = p_winner_applicant_id OR mobile_user_id = p_winner_applicant_id) AND status = 'active';

        IF v_stall_count >= 2 THEN
          UPDATE raffle_participants SET status = 'Removed'
          WHERE applicant_id = p_winner_applicant_id AND status = 'Registered' AND raffle_id != p_raffle_id;

          UPDATE auction_participants SET status = 'Removed'
          WHERE applicant_id = p_winner_applicant_id AND status = 'Registered';
        END IF;

        SELECT v_stall_count AS new_stall_count;
      END
    `);
    console.log('   ✅ sp_finalize_raffle_winner created');

    // --- sp_auto_remove_max_stall_participants ---
    console.log('5. Creating sp_auto_remove_max_stall_participants...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_auto_remove_max_stall_participants');
    await connection.query(`
      CREATE PROCEDURE sp_auto_remove_max_stall_participants(
        IN p_applicant_id INT,
        IN p_exclude_auction_id INT,
        IN p_exclude_raffle_id INT
      )
      BEGIN
        DECLARE v_stall_count INT DEFAULT 0;

        SELECT COUNT(*) INTO v_stall_count FROM stallholder
        WHERE (applicant_id = p_applicant_id OR mobile_user_id = p_applicant_id) AND status = 'active';

        IF v_stall_count >= 2 THEN
          IF p_exclude_auction_id IS NOT NULL THEN
            UPDATE auction_participants SET status = 'Removed'
            WHERE applicant_id = p_applicant_id AND status = 'Registered' AND auction_id != p_exclude_auction_id;
          ELSE
            UPDATE auction_participants SET status = 'Removed'
            WHERE applicant_id = p_applicant_id AND status = 'Registered';
          END IF;

          IF p_exclude_raffle_id IS NOT NULL THEN
            UPDATE raffle_participants SET status = 'Removed'
            WHERE applicant_id = p_applicant_id AND status = 'Registered' AND raffle_id != p_exclude_raffle_id;
          ELSE
            UPDATE raffle_participants SET status = 'Removed'
            WHERE applicant_id = p_applicant_id AND status = 'Registered';
          END IF;
        END IF;

        SELECT v_stall_count AS current_stall_count;
      END
    `);
    console.log('   ✅ sp_auto_remove_max_stall_participants created');

    // ============================================================
    // 3. VERIFY
    // ============================================================
    console.log('\n--- Verification ---');
    const [c1] = await connection.execute("SHOW COLUMNS FROM auction_participants WHERE Field='status'");
    console.log('auction_participants.status:', c1[0].Type);
    const [c2] = await connection.execute("SHOW COLUMNS FROM raffle_participants WHERE Field='status'");
    console.log('raffle_participants.status:', c2[0].Type);

    const [procs] = await connection.execute(
      "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME LIKE 'sp_%'",
      [process.env.DB_NAME]
    );
    console.log('Stored procedures:');
    procs.forEach(p => console.log('  -', p.ROUTINE_NAME));

    console.log('\n✅ All database fixes applied successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
})();
