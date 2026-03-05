-- ============================================================
-- sp_finalize_raffle_winner
-- Handles all DB operations for selecting a raffle winner:
--   1. Update raffle status to Drawn
--   2. Mark winner/non-winners in raffle_participants
--   3. Update stall to Occupied
--   4. Create stallholder record (if not exists)
--   5. Approve applicant
--   6. Create raffle_result record
--   7. Approve application (if exists)
--   8. Reject other pending applications
--   9. Log the action
--  10. Auto-remove from other auctions/raffles if at 2 stalls
-- ============================================================

DELIMITER //

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
END //

DELIMITER ;
