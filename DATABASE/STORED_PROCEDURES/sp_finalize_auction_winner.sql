-- ============================================================
-- sp_finalize_auction_winner
-- Handles all DB operations for selecting an auction winner:
--   1. Update auction status to Awarded
--   2. Mark winning bid
--   3. Mark winner/non-winners in auction_participants
--   4. Update stall to Occupied
--   5. Create auction_result record
--   6. Approve application (if exists)
--   7. Create stallholder record (if not exists)
--   8. Approve applicant
--   9. Reject other pending applications
--  10. Log the action
--  11. Auto-remove from other auctions/raffles if at 2 stalls
-- ============================================================

DELIMITER //

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
END //

DELIMITER ;
