-- Fix sp_deleteStall_complete to use stall_number instead of stall_no
DROP PROCEDURE IF EXISTS sp_deleteStall_complete;

DELIMITER //

CREATE PROCEDURE sp_deleteStall_complete(
  IN p_stall_id INT,
  IN p_user_id INT,
  IN p_user_type VARCHAR(50),
  IN p_branch_id INT,
  OUT p_success BOOLEAN,
  OUT p_message VARCHAR(500)
)
proc_label: BEGIN
  DECLARE v_existing_branch_id INT DEFAULT NULL;
  DECLARE v_has_active_subscription INT DEFAULT 0;
  DECLARE v_has_applications INT DEFAULT 0;
  DECLARE v_stall_number VARCHAR(50) DEFAULT NULL;
  DECLARE v_floor_id INT DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1
      @sqlstate = RETURNED_SQLSTATE,
      @errno = MYSQL_ERRNO,
      @text = MESSAGE_TEXT;
    ROLLBACK;
    SET p_success = FALSE;
    SET p_message = CONCAT('Database error: ', @text);
  END;

  START TRANSACTION;

  -- Get stall info using stall_number instead of stall_no
  SELECT s.stall_number, s.section_id INTO v_stall_number, v_floor_id
  FROM stall s
  WHERE s.stall_id = p_stall_id;

  IF v_stall_number IS NULL THEN
    SET p_success = FALSE;
    SET p_message = 'Stall not found';
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Get branch from section/floor
  SELECT f.branch_id INTO v_existing_branch_id
  FROM section sec
  INNER JOIN floor f ON sec.floor_id = f.floor_id
  WHERE sec.section_id = v_floor_id;

  IF v_existing_branch_id IS NULL THEN
    SET p_success = FALSE;
    SET p_message = 'Stall not found';
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Authorization check for business_manager
  IF p_user_type = 'business_manager' THEN
    IF NOT EXISTS (
      SELECT 1 FROM business_manager
      WHERE business_manager_id = p_user_id AND branch_id = v_existing_branch_id
    ) THEN
      SET p_success = FALSE;
      SET p_message = 'Access denied. Stall does not belong to your branch';
      ROLLBACK;
      LEAVE proc_label;
    END IF;
  ELSEIF p_user_type = 'business_employee' THEN
    IF p_branch_id != v_existing_branch_id THEN
      SET p_success = FALSE;
      SET p_message = 'Access denied. Stall does not belong to your branch';
      ROLLBACK;
      LEAVE proc_label;
    END IF;
  ELSE
    SET p_success = FALSE;
    SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot delete stalls');
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Check for applications
  SELECT COUNT(*) INTO v_has_applications
  FROM application
  WHERE stall_id = p_stall_id;

  IF v_has_applications > 0 THEN
    SET p_success = FALSE;
    SET p_message = CONCAT('Cannot delete stall ', v_stall_number, '. Application records exist. Archive stall instead of deleting');
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Check for stallholders
  IF EXISTS (SELECT 1 FROM stallholder WHERE stall_id = p_stall_id) THEN
    SET p_success = FALSE;
    SET p_message = CONCAT('Cannot delete stall ', v_stall_number, '. Stallholder records exist. Archive stall instead of deleting');
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Check for auctions
  IF EXISTS (SELECT 1 FROM auction WHERE stall_id = p_stall_id) THEN
    SET p_success = FALSE;
    SET p_message = CONCAT('Cannot delete stall ', v_stall_number, '. Auction records exist. Archive stall instead of deleting');
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Check for raffles
  IF EXISTS (SELECT 1 FROM raffle WHERE stall_id = p_stall_id) THEN
    SET p_success = FALSE;
    SET p_message = CONCAT('Cannot delete stall ', v_stall_number, '. Raffle records exist. Archive stall instead of deleting');
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Check for violation reports
  IF EXISTS (SELECT 1 FROM violation_report WHERE stall_id = p_stall_id) THEN
    SET p_success = FALSE;
    SET p_message = CONCAT('Cannot delete stall ', v_stall_number, '. Violation reports exist. Archive stall instead of deleting');
    ROLLBACK;
    LEAVE proc_label;
  END IF;

  -- Delete stall images first (foreign key constraint)
  DELETE FROM stall_images WHERE stall_id = p_stall_id;

  -- Delete the stall
  DELETE FROM stall WHERE stall_id = p_stall_id;

  SET p_success = TRUE;
  SET p_message = CONCAT('Stall ', v_stall_number, ' deleted successfully');

  COMMIT;
END //

DELIMITER ;
