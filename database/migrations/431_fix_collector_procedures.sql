-- =============================================
-- 431: FIX COLLECTOR CREATION - Add missing procedures
-- =============================================

-- FIX 1: sp_checkCollectorTableExists
DROP PROCEDURE IF EXISTS `sp_checkCollectorTableExists`;

DELIMITER $$
CREATE PROCEDURE `sp_checkCollectorTableExists`()
BEGIN
    SELECT COUNT(*) as table_exists
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'collector';
END$$
DELIMITER ;

-- FIX 2: sp_checkCollectorEmailExists
DROP PROCEDURE IF EXISTS `sp_checkCollectorEmailExists`;

DELIMITER $$
CREATE PROCEDURE `sp_checkCollectorEmailExists`(IN p_email VARCHAR(255))
BEGIN
    SELECT collector_id 
    FROM collector 
    WHERE email = p_email COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$
DELIMITER ;

-- FIX 3: sp_createCollectorAssignmentDirect
DROP PROCEDURE IF EXISTS `sp_createCollectorAssignmentDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createCollectorAssignmentDirect`(
    IN p_collector_id INT,
    IN p_branch_id INT,
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO collector_assignment (
        collector_id,
        branch_id,
        start_date,
        status,
        remarks
    )
    VALUES (
        p_collector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        p_remarks
    );
    
    SELECT LAST_INSERT_ID() as assignment_id;
END$$
DELIMITER ;

-- FIX 4: sp_logCollectorAction
DROP PROCEDURE IF EXISTS `sp_logCollectorAction`;

DELIMITER $$
CREATE PROCEDURE `sp_logCollectorAction`(
    IN p_collector_id INT,
    IN p_branch_id INT,
    IN p_manager_id INT,
    IN p_action_type VARCHAR(50),
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    )
    VALUES (
        p_collector_id,
        p_branch_id,
        p_manager_id,
        p_action_type,
        NOW(),
        p_remarks
    );
    
    SELECT LAST_INSERT_ID() as action_id;
END$$
DELIMITER ;

-- FIX 5: sp_createCollectorDirect (proper version)
DROP PROCEDURE IF EXISTS `sp_createCollectorDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createCollectorDirect`(
  IN p_username VARCHAR(50),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_contact_no VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64) DEFAULT NULL;
  DECLARE v_collector_id INT;
  DECLARE v_masked_first VARCHAR(100);
  DECLARE v_masked_last VARCHAR(100);
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = p_first_name;
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = p_last_name;
  END IF;
  
  IF v_key IS NOT NULL THEN
    INSERT INTO collector (
      username, password_hash, 
      first_name, last_name,
      email, contact_no, 
      date_created, status,
      encrypted_first_name, encrypted_last_name, encrypted_contact,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash, 
      v_masked_first, v_masked_last,
      p_email, p_contact_no, 
      NOW(), 'active',
      AES_ENCRYPT(p_first_name, v_key),
      AES_ENCRYPT(p_last_name, v_key),
      AES_ENCRYPT(p_contact_no, v_key),
      1
    );
  ELSE
    INSERT INTO collector (
      username, password_hash, first_name, last_name,
      email, contact_no, date_created, status
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name,
      p_email, p_contact_no, NOW(), 'active'
    );
  END IF;
  
  SET v_collector_id = LAST_INSERT_ID();
  SELECT v_collector_id as collector_id;
END$$
DELIMITER ;

-- FIX 6: Similar procedures for inspector
DROP PROCEDURE IF EXISTS `sp_checkInspectorTableExists`;

DELIMITER $$
CREATE PROCEDURE `sp_checkInspectorTableExists`()
BEGIN
    SELECT COUNT(*) as table_exists
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inspector';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_checkInspectorEmailExists`;

DELIMITER $$
CREATE PROCEDURE `sp_checkInspectorEmailExists`(IN p_email VARCHAR(255))
BEGIN
    SELECT inspector_id 
    FROM inspector 
    WHERE email = p_email COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_createInspectorAssignmentDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createInspectorAssignmentDirect`(
    IN p_inspector_id INT,
    IN p_branch_id INT,
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO inspector_assignment (
        inspector_id,
        branch_id,
        start_date,
        status,
        remarks
    )
    VALUES (
        p_inspector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        p_remarks
    );
    
    SELECT LAST_INSERT_ID() as assignment_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_logInspectorAction`;

DELIMITER $$
CREATE PROCEDURE `sp_logInspectorAction`(
    IN p_inspector_id INT,
    IN p_branch_id INT,
    IN p_manager_id INT,
    IN p_action_type VARCHAR(50),
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO inspector_action_log (
        inspector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    )
    VALUES (
        p_inspector_id,
        p_branch_id,
        p_manager_id,
        p_action_type,
        NOW(),
        p_remarks
    );
    
    SELECT LAST_INSERT_ID() as action_id;
END$$
DELIMITER ;

SELECT '✅ Migration 431 complete! Collector creation should work now.' as status;
