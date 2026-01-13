-- =============================================
-- 420: Fix Missing Encrypted Columns and Update Decryption Procedures
-- Adds missing encrypted columns and fixes stored procedures
-- =============================================

DELIMITER $$

-- =============================================
-- 0. ADD MISSING last_logout COLUMN TO INSPECTOR/COLLECTOR
-- =============================================
DROP PROCEDURE IF EXISTS `fix_inspector_last_logout`$$
CREATE PROCEDURE `fix_inspector_last_logout`()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'last_logout'
  ) THEN
    ALTER TABLE inspector ADD COLUMN last_logout TIMESTAMP NULL;
  END IF;
END$$

CALL fix_inspector_last_logout()$$
DROP PROCEDURE IF EXISTS `fix_inspector_last_logout`$$

DROP PROCEDURE IF EXISTS `fix_collector_last_logout`$$
CREATE PROCEDURE `fix_collector_last_logout`()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'last_logout'
  ) THEN
    ALTER TABLE collector ADD COLUMN last_logout TIMESTAMP NULL;
  END IF;
END$$

CALL fix_collector_last_logout()$$
DROP PROCEDURE IF EXISTS `fix_collector_last_logout`$$

-- =============================================
-- 1. ADD MISSING ENCRYPTED COLUMNS TO INSPECTOR
-- =============================================
DROP PROCEDURE IF EXISTS `fix_inspector_encrypted_columns`$$
CREATE PROCEDURE `fix_inspector_encrypted_columns`()
BEGIN
  -- Add encrypted_first_name if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'encrypted_first_name'
  ) THEN
    ALTER TABLE inspector ADD COLUMN encrypted_first_name VARBINARY(512) NULL;
  END IF;
  
  -- Add encrypted_last_name if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'encrypted_last_name'
  ) THEN
    ALTER TABLE inspector ADD COLUMN encrypted_last_name VARBINARY(512) NULL;
  END IF;
  
  -- Add encrypted_contact if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'encrypted_contact'
  ) THEN
    ALTER TABLE inspector ADD COLUMN encrypted_contact VARBINARY(256) NULL;
  END IF;
  
  -- Add encrypted_email if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'encrypted_email'
  ) THEN
    ALTER TABLE inspector ADD COLUMN encrypted_email VARBINARY(256) NULL;
  END IF;
  
  -- Add is_encrypted if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'is_encrypted'
  ) THEN
    ALTER TABLE inspector ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
  END IF;
END$$

CALL fix_inspector_encrypted_columns()$$
DROP PROCEDURE IF EXISTS `fix_inspector_encrypted_columns`$$

-- =============================================
-- 2. ADD MISSING ENCRYPTED COLUMNS TO COLLECTOR
-- =============================================
DROP PROCEDURE IF EXISTS `fix_collector_encrypted_columns`$$
CREATE PROCEDURE `fix_collector_encrypted_columns`()
BEGIN
  -- Add encrypted_first_name if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_first_name'
  ) THEN
    ALTER TABLE collector ADD COLUMN encrypted_first_name VARBINARY(512) NULL;
  END IF;
  
  -- Add encrypted_last_name if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_last_name'
  ) THEN
    ALTER TABLE collector ADD COLUMN encrypted_last_name VARBINARY(512) NULL;
  END IF;
  
  -- Add encrypted_contact if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_contact'
  ) THEN
    ALTER TABLE collector ADD COLUMN encrypted_contact VARBINARY(256) NULL;
  END IF;
  
  -- Add encrypted_email if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_email'
  ) THEN
    ALTER TABLE collector ADD COLUMN encrypted_email VARBINARY(256) NULL;
  END IF;
  
  -- Add is_encrypted if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'is_encrypted'
  ) THEN
    ALTER TABLE collector ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
  END IF;
END$$

CALL fix_collector_encrypted_columns()$$
DROP PROCEDURE IF EXISTS `fix_collector_encrypted_columns`$$

-- =============================================
-- 3. ADD MISSING ENCRYPTED COLUMNS TO BUSINESS_EMPLOYEE
-- =============================================
DROP PROCEDURE IF EXISTS `fix_employee_encrypted_columns`$$
CREATE PROCEDURE `fix_employee_encrypted_columns`()
BEGIN
  -- Add encrypted_first_name if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_employee' AND COLUMN_NAME = 'encrypted_first_name'
  ) THEN
    ALTER TABLE business_employee ADD COLUMN encrypted_first_name VARBINARY(512) NULL;
  END IF;
  
  -- Add encrypted_last_name if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_employee' AND COLUMN_NAME = 'encrypted_last_name'
  ) THEN
    ALTER TABLE business_employee ADD COLUMN encrypted_last_name VARBINARY(512) NULL;
  END IF;
  
  -- Add encrypted_phone if missing  
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_employee' AND COLUMN_NAME = 'encrypted_phone'
  ) THEN
    ALTER TABLE business_employee ADD COLUMN encrypted_phone VARBINARY(256) NULL;
  END IF;
  
  -- Add is_encrypted if missing
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_employee' AND COLUMN_NAME = 'is_encrypted'
  ) THEN
    ALTER TABLE business_employee ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
  END IF;
END$$

CALL fix_employee_encrypted_columns()$$
DROP PROCEDURE IF EXISTS `fix_employee_encrypted_columns`$$

-- =============================================
-- 4. RECREATE INSPECTOR DECRYPTION PROCEDURES (FIXED)
-- Use COALESCE to handle missing encrypted columns gracefully
-- NOTE: email is NOT encrypted for inspector/collector, only name and contact
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE i.first_name 
    END as first_name,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE i.last_name 
    END as last_name,
    i.email as email,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE i.contact_no 
    END as contact_no,
    i.status,
    i.date_hired,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id;
END$$

-- =============================================
-- 4b. RECREATE sp_getInspectorsByBranchDecrypted (FIXED)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE i.first_name 
    END as first_name,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE i.last_name 
    END as last_name,
    i.middle_name,
    i.email,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE i.contact_no 
    END as contact_no,
    i.date_hired,
    i.status,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id
  WHERE ia.branch_id = p_branch_id
  ORDER BY i.date_hired DESC;
END$$

-- =============================================
-- 5. RECREATE COLLECTOR DECRYPTION PROCEDURES (FIXED)
-- NOTE: email is NOT encrypted for inspector/collector
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getCollectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
      ELSE c.first_name 
    END as first_name,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
      ELSE c.last_name 
    END as last_name,
    c.email as email,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
      ELSE c.contact_no 
    END as contact_no,
    c.status,
    c.date_hired,
    c.last_login,
    c.last_logout,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id;
END$$

-- =============================================
-- 5b. RECREATE sp_getCollectorsByBranchDecrypted (FIXED)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getCollectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
      ELSE c.first_name 
    END as first_name,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
      ELSE c.last_name 
    END as last_name,
    c.middle_name,
    c.email,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
      ELSE c.contact_no 
    END as contact_no,
    c.date_hired,
    c.status,
    c.last_login,
    c.last_logout,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id
  WHERE ca.branch_id = p_branch_id
  ORDER BY c.date_hired DESC;
END$$

-- =============================================
-- 6. FIX getAllComplianceRecordsDecrypted
-- The inspector table may not have is_encrypted yet
-- =============================================
DROP PROCEDURE IF EXISTS `getAllComplianceRecordsDecrypted`$$

CREATE PROCEDURE `getAllComplianceRecordsDecrypted` (
    IN `p_branch_id` INT, 
    IN `p_status` VARCHAR(20), 
    IN `p_search` VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        vr.report_id AS compliance_id,
        vr.date_reported AS date,
        COALESCE(vr.compliance_type, v.violation_type) AS type,
        -- Inspector name - check if encrypted columns exist
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                CONCAT(
                    CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100)), 
                    ' ', 
                    CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
                )
            ELSE CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) 
        END AS inspector,
        -- Stallholder name
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name 
        END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        s.stall_no AS stall_no,
        vr.offense_no AS offense_no,
        vp.penalty_amount AS penalty_amount,
        vr.stallholder_id AS stallholder_id,
        vr.stall_id AS stall_id,
        vr.inspector_id AS inspector_id,
        vr.violation_id AS violation_id,
        vr.evidence AS evidence,
        vr.receipt_number AS receipt_number,
        vr.payment_date AS payment_date,
        vr.payment_reference AS payment_reference,
        vr.paid_amount AS paid_amount,
        vr.collected_by AS collected_by,
        v.ordinance_no AS ordinance_no,
        v.details AS violation_details,
        vp.remarks AS penalty_remarks,
        sh.compliance_status AS stallholder_compliance_status,
        -- Stallholder contact
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE sh.contact_number 
        END AS stallholder_contact,
        -- Stallholder email
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE sh.email 
        END AS stallholder_email
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE 
        (p_branch_id IS NULL OR b.branch_id = p_branch_id)
        AND (p_status IS NULL OR p_status COLLATE utf8mb4_general_ci = 'all' OR vr.status COLLATE utf8mb4_general_ci = p_status COLLATE utf8mb4_general_ci)
        AND (
            p_search IS NULL OR p_search = '' OR
            vr.report_id LIKE CONCAT('%', p_search, '%') OR
            COALESCE(vr.compliance_type, v.violation_type) LIKE CONCAT('%', p_search, '%') OR
            CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) LIKE CONCAT('%', p_search, '%') OR
            sh.stallholder_name LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY vr.date_reported DESC;
END$$

-- =============================================
-- 7. FIX getComplianceRecordByIdDecrypted
-- =============================================
DROP PROCEDURE IF EXISTS `getComplianceRecordByIdDecrypted`$$

CREATE PROCEDURE `getComplianceRecordByIdDecrypted` (IN `p_report_id` INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        vr.report_id AS compliance_id,
        vr.date_reported AS date,
        COALESCE(vr.compliance_type, v.violation_type) AS type,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                CONCAT(
                    CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100)), 
                    ' ', 
                    CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
                )
            ELSE CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) 
        END AS inspector,
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name 
        END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        s.stall_no AS stall_no,
        vr.offense_no AS offense_no,
        vp.penalty_amount AS penalty_amount,
        vr.stallholder_id AS stallholder_id,
        vr.stall_id AS stall_id,
        vr.inspector_id AS inspector_id,
        vr.violation_id AS violation_id,
        vr.evidence AS evidence,
        vr.receipt_number AS receipt_number,
        vr.payment_date AS payment_date,
        vr.payment_reference AS payment_reference,
        vr.paid_amount AS paid_amount,
        vr.collected_by AS collected_by,
        v.ordinance_no AS ordinance_no,
        v.details AS violation_details,
        vp.remarks AS penalty_remarks,
        sh.compliance_status AS stallholder_compliance_status,
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE sh.contact_number 
        END AS stallholder_contact,
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE sh.email 
        END AS stallholder_email
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE vr.report_id = p_report_id;
END$$

-- =============================================
-- 8. FIX getAllComplaintsDecrypted - complaint table doesn't have encrypted columns
-- Use plain columns since complaint table is not encrypted
-- =============================================
DROP PROCEDURE IF EXISTS `getAllComplaintsDecrypted`$$

CREATE PROCEDURE `getAllComplaintsDecrypted`(
    IN p_branch_id INT,
    IN p_status VARCHAR(20),
    IN p_search VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.complaint_id,
        c.complaint_type,
        c.sender_id,
        -- Complaint table is NOT encrypted, use plain columns
        c.sender_name AS sender_name,
        c.sender_contact AS sender_contact,
        c.sender_email AS sender_email,
        c.stallholder_id,
        -- Decrypt stallholder name from stallholder table (which IS encrypted)
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name 
        END AS stallholder_name,
        c.stall_id,
        s.stall_no,
        c.branch_id,
        b.branch_name,
        c.subject,
        c.description,
        c.evidence,
        c.status,
        c.priority,
        c.resolution_notes,
        c.date_submitted,
        c.date_resolved,
        c.created_at,
        c.updated_at
    FROM complaint c
    LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON c.stall_id = s.stall_id
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status COLLATE utf8mb4_general_ci = 'all' OR c.status COLLATE utf8mb4_general_ci = p_status COLLATE utf8mb4_general_ci)
    AND (
        p_search IS NULL OR p_search = '' OR
        c.complaint_id LIKE CONCAT('%', p_search, '%') OR
        c.complaint_type LIKE CONCAT('%', p_search, '%') OR
        c.sender_name LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        c.subject LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY c.date_submitted DESC;
END$$

-- =============================================
-- 9. FIX sp_getComplaintsByStallholderDecrypted
-- Complaint table is not encrypted
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getComplaintsByStallholderDecrypted`$$

CREATE PROCEDURE `sp_getComplaintsByStallholderDecrypted`(IN p_stallholder_id INT)
BEGIN
    -- Complaint table is NOT encrypted, return plain columns
    SELECT 
        c.complaint_id,
        c.complaint_type,
        c.sender_name AS sender_name,
        c.sender_contact AS sender_contact,
        c.sender_email AS sender_email,
        c.stallholder_id,
        c.stall_id,
        c.branch_id,
        c.subject,
        c.description,
        c.status,
        c.priority,
        c.resolution_notes AS response,
        NULL AS responded_by,
        c.date_resolved AS responded_at,
        c.evidence,
        c.created_at,
        c.updated_at,
        b.branch_name,
        s.stall_no
    FROM complaint c
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    LEFT JOIN stall s ON c.stall_id = s.stall_id
    WHERE c.stallholder_id = p_stallholder_id
    ORDER BY c.created_at DESC;
END$$

DELIMITER ;

SELECT '✅ Migration 420 complete - Fixed encrypted columns and decryption procedures!' as status;
