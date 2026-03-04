-- ============================================================
-- sp_auto_remove_max_stall_participants
-- Removes an applicant from all other auctions/raffles when
-- they reach the maximum of 2 active stalls.
-- Used after winner assignment to enforce the global 2-stall limit.
-- ============================================================

DELIMITER //

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
END //

DELIMITER ;
