-- =====================================================
-- Stored Procedure: sp_ProcessStallSurrender
-- Description: Processes a stall surrender request, moves
--              data to logs, updates stall and stallholder
--              status.
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_ProcessStallSurrender //

CREATE PROCEDURE sp_ProcessStallSurrender(
    IN p_request_id INT,
    IN p_stall_id INT,
    IN p_stallholder_id INT,
    IN p_employee_id INT,
    IN p_feedback TEXT
)
BEGIN
    DECLARE v_has_unpaid_bills INT DEFAULT 0;
    DECLARE v_has_active_violations INT DEFAULT 0;
    DECLARE v_lease_start DATE;
    DECLARE v_user_name VARCHAR(255);
    DECLARE v_reason TEXT;
    
    -- 1. Eligibility Check: Ensure no outstanding balance (rely on real-time payment_status column)
    SELECT COUNT(*) INTO v_has_unpaid_bills 
    FROM stallholder 
    WHERE stallholder_id = p_stallholder_id 
      AND payment_status IN ('overdue', 'unpaid');

    -- 2. Eligibility Check: Ensure no open violations
    SELECT COUNT(*) INTO v_has_active_violations
    FROM violation_report
    WHERE stallholder_id = p_stallholder_id AND status = 'Open';

    IF v_has_unpaid_bills > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot surrender: Outstanding payments found.';
    ELSEIF v_has_active_violations > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot surrender: Active violations found.';
    ELSE
        -- Start Transaction
        START TRANSACTION;

        -- 3. Fetch data from current stallholder record
        SELECT move_in_date, full_name INTO v_lease_start, v_user_name 
        FROM stallholder 
        WHERE stallholder_id = p_stallholder_id;
        
        -- Fetch reason from the request
        SELECT reason INTO v_reason
        FROM stall_surrender_requests
        WHERE request_id = p_request_id;

        -- 4. Move data to History Logs
        INSERT INTO stallholder_history_logs (
            stall_id, stallholder_id, user_fullname, lease_start_date, 
            surrender_reason, feedback_to_next_tenant, processed_by_employee_id
        ) VALUES (
            p_stall_id, p_stallholder_id, v_user_name, v_lease_start, 
            v_reason, p_feedback, p_employee_id
        );

        -- 5. Complete the Request Status
        UPDATE stall_surrender_requests 
        SET status = 'Completed', updated_at = NOW() 
        WHERE request_id = p_request_id;

        -- 6. Update Stall Status to Available and clear assigned stallholder
        UPDATE stall 
        SET status = 'Available', 
            is_available = 1, 
            stallholder_id = NULL,
            raffle_auction_status = 'Not Started',
            deadline_active = 0,
            raffle_auction_deadline = NULL
        WHERE stall_id = p_stall_id;

        -- 7. Update Stallholder status as 'Inactive' (PRESERVE stall_id for payment history)
        UPDATE stallholder
        SET status = 'Inactive'
        WHERE stallholder_id = p_stallholder_id;

        -- 8. Cleanup raffle/auction participations for this applicant/stall
        UPDATE raffle_participants rp
        JOIN stallholder sh ON rp.applicant_id = sh.applicant_id
        SET rp.status = 'Removed'
        WHERE sh.stallholder_id = p_stallholder_id
        AND rp.raffle_id IN (SELECT raffle_id FROM raffle WHERE stall_id = p_stall_id);

        UPDATE auction_participants ap
        JOIN stallholder sh ON ap.applicant_id = sh.applicant_id
        SET ap.status = 'Removed'
        WHERE sh.stallholder_id = p_stallholder_id
        AND ap.auction_id IN (SELECT auction_id FROM auction WHERE stall_id = p_stall_id);

        -- 9. Close any Active or Drawn raffles/auctions for this stall 
        UPDATE raffle 
        SET status = 'Closed' 
        WHERE stall_id = p_stall_id AND status IN ('Active', 'Drawn');

        UPDATE auction 
        SET status = 'Closed' 
        WHERE stall_id = p_stall_id AND status IN ('Active', 'Awarded');

        COMMIT;
    END IF;
END //

DELIMITER ;
