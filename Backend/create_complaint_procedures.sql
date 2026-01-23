-- =============================================
-- 408: Complaint Management Stored Procedures
-- Created: Auto-generated for 100% SP compliance
-- Updated: January 2026 with decryption support
-- =============================================

DELIMITER $$

-- =============================================
-- Create complaint table if not exists
-- =============================================
DROP PROCEDURE IF EXISTS sp_ensureComplaintTableExists$$
CREATE PROCEDURE sp_ensureComplaintTableExists()
BEGIN
  CREATE TABLE IF NOT EXISTS complaint (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_type VARCHAR(100) NOT NULL,
    sender_name VARCHAR(500),
    sender_contact VARCHAR(500),
    sender_email VARCHAR(500),
    stallholder_id INT,
    stall_id INT,
    branch_id INT,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence LONGBLOB,
    status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    resolution_notes TEXT,
    resolved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    INDEX idx_stallholder (stallholder_id),
    INDEX idx_status (status),
    INDEX idx_branch (branch_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
END$$

-- =============================================
-- Get stallholder details for complaint (DECRYPTED)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallholderDetailsForComplaintDecrypted$$
CREATE PROCEDURE sp_getStallholderDetailsForComplaintDecrypted(
  IN p_stallholder_id INT
)
BEGIN
  -- Try stallholder table - return decrypted data
  -- Join with stall table to get stall_number
  SELECT 
    sh.full_name as sender_name,
    sh.contact_number as sender_contact,
    sh.email as sender_email,
    sh.branch_id,
    sh.stall_id,
    s.stall_number,
    'stallholder' as source
  FROM stallholder sh
  LEFT JOIN stall s ON sh.stall_id = s.stall_id
  WHERE sh.stallholder_id = p_stallholder_id OR sh.applicant_id = p_stallholder_id
  LIMIT 1;
END$$

-- =============================================
-- Get applicant details for complaint fallback (DECRYPTED)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDetailsForComplaintDecrypted$$
CREATE PROCEDURE sp_getApplicantDetailsForComplaintDecrypted(
  IN p_applicant_id INT
)
BEGIN
  -- Try applicant table - return decrypted data
  -- Use column names that exist in applicant table
  SELECT 
    full_name as sender_name,
    contact_number as sender_contact,
    email as sender_email,
    NULL as branch_id,
    NULL as stall_id,
    NULL as stall_number,
    'applicant' as source
  FROM applicant 
  WHERE applicant_id = p_applicant_id
  LIMIT 1;
END$$

-- =============================================
-- Insert new complaint (LEGACY - DO NOT USE)
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertComplaint$$
CREATE PROCEDURE sp_insertComplaint(
  IN p_complaint_type VARCHAR(100),
  IN p_sender_name VARCHAR(500),
  IN p_sender_contact VARCHAR(500),
  IN p_sender_email VARCHAR(500),
  IN p_stallholder_id INT,
  IN p_stall_id INT,
  IN p_branch_id INT,
  IN p_subject VARCHAR(255),
  IN p_description TEXT,
  IN p_evidence TEXT
)
BEGIN
  DECLARE v_evidence_blob LONGBLOB DEFAULT NULL;
  
  IF p_evidence IS NOT NULL AND p_evidence != '' THEN
    SET v_evidence_blob = FROM_BASE64(p_evidence);
  END IF;
  
  INSERT INTO complaint (
    complaint_type,
    sender_name,
    sender_contact,
    sender_email,
    stallholder_id,
    stall_id,
    branch_id,
    subject,
    description,
    evidence,
    status,
    created_at
  ) VALUES (
    p_complaint_type,
    p_sender_name,
    p_sender_contact,
    p_sender_email,
    p_stallholder_id,
    p_stall_id,
    p_branch_id,
    p_subject,
    p_description,
    v_evidence_blob,
    'pending',
    NOW()
  );
  
  SELECT LAST_INSERT_ID() as complaint_id;
END$$

-- =============================================
-- Submit new complaint (SIMPLIFIED - USE THIS)
-- =============================================
DROP PROCEDURE IF EXISTS sp_submitComplaint$$
CREATE PROCEDURE sp_submitComplaint(
  IN p_complaint_type VARCHAR(100),
  IN p_stallholder_id INT,
  IN p_stall_id INT,
  IN p_branch_id INT,
  IN p_subject VARCHAR(255),
  IN p_description TEXT,
  IN p_evidence_text TEXT
)
BEGIN
  DECLARE v_sender_name VARCHAR(500);
  DECLARE v_sender_contact VARCHAR(500);
  DECLARE v_sender_email VARCHAR(500);
  
  -- Fetch sender details from stallholder table
  SELECT full_name, contact_number, email
  INTO v_sender_name, v_sender_contact, v_sender_email
  FROM stallholder
  WHERE stallholder_id = p_stallholder_id
  LIMIT 1;
  
  -- If not found in stallholder, try applicant table
  IF v_sender_name IS NULL THEN
    SELECT full_name, contact_number, email
    INTO v_sender_name, v_sender_contact, v_sender_email
    FROM applicant
    WHERE applicant_id = p_stallholder_id
    LIMIT 1;
  END IF;
  
  INSERT INTO complaint (
    complaint_type,
    sender_name,
    sender_contact,
    sender_email,
    stallholder_id,
    stall_id,
    branch_id,
    subject,
    description,
    evidence,
    status,
    created_at
  ) VALUES (
    p_complaint_type,
    v_sender_name,
    v_sender_contact,
    v_sender_email,
    p_stallholder_id,
    p_stall_id,
    p_branch_id,
    p_subject,
    p_description,
    NULL,
    'pending',
    NOW()
  );
  
  SELECT LAST_INSERT_ID() as complaint_id;
END$$

-- =============================================
-- Get complaints by stallholder
-- =============================================
DROP PROCEDURE IF EXISTS sp_getComplaintsByStallholder$$
CREATE PROCEDURE sp_getComplaintsByStallholder(
  IN p_stallholder_id INT
)
BEGIN
  SELECT 
    complaint_id,
    complaint_type,
    subject,
    description,
    status,
    resolution_notes,
    created_at,
    updated_at,
    resolved_at
  FROM complaint 
  WHERE stallholder_id = p_stallholder_id
  ORDER BY created_at DESC;
END$$

-- =============================================
-- Get complaint by ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getComplaintById$$
CREATE PROCEDURE sp_getComplaintById(
  IN p_complaint_id INT
)
BEGIN
  SELECT 
    complaint_id,
    complaint_type,
    sender_name,
    sender_contact,
    sender_email,
    stallholder_id,
    stall_id,
    branch_id,
    subject,
    description,
    evidence,
    status,
    resolution_notes,
    resolved_by,
    created_at,
    updated_at,
    resolved_at
  FROM complaint 
  WHERE complaint_id = p_complaint_id;
END$$

-- =============================================
-- Get complaint by ID (same as above, for compatibility)
-- =============================================
DROP PROCEDURE IF EXISTS getComplaintById$$
CREATE PROCEDURE getComplaintById(
  IN p_complaint_id INT
)
BEGIN
  SELECT 
    complaint_id,
    complaint_type,
    sender_name,
    sender_contact,
    sender_email,
    stallholder_id,
    stall_id,
    branch_id,
    subject,
    description,
    evidence,
    status,
    resolution_notes,
    resolved_by,
    created_at,
    updated_at,
    resolved_at
  FROM complaint 
  WHERE complaint_id = p_complaint_id;
END$$

-- =============================================
-- Get all complaints with filters (DECRYPTED)
-- =============================================
DROP PROCEDURE IF EXISTS getAllComplaintsDecrypted$$
CREATE PROCEDURE getAllComplaintsDecrypted(
  IN p_branch_id INT,
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(255)
)
BEGIN
  -- Build dynamic query based on filters
  SET @sql = 'SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    c.stall_id,
    c.branch_id,
    c.subject,
    c.description,
    c.status,
    c.resolution_notes,
    c.resolved_by,
    c.resolved_at,
    c.created_at,
    c.updated_at,
    s.stall_number,
    sh.full_name as stallholder_name,
    b.branch_name
  FROM complaint c
  LEFT JOIN stall s ON c.stall_id = s.stall_id
  LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
  LEFT JOIN branch b ON c.branch_id = b.branch_id
  WHERE 1=1';
  
  -- Add branch filter if provided
  IF p_branch_id IS NOT NULL THEN
    SET @sql = CONCAT(@sql, ' AND c.branch_id = ', p_branch_id);
  END IF;
  
  -- Add status filter if provided
  IF p_status IS NOT NULL AND p_status != 'all' THEN
    SET @sql = CONCAT(@sql, ' AND c.status = ''', p_status, '''');
  END IF;
  
  -- Add search filter if provided
  IF p_search IS NOT NULL AND p_search != '' THEN
    SET @sql = CONCAT(@sql, 
      ' AND (c.subject LIKE ''%', p_search, '%'' ',
      'OR c.description LIKE ''%', p_search, '%'' ',
      'OR c.sender_name LIKE ''%', p_search, '%'' ',
      'OR c.complaint_type LIKE ''%', p_search, '%'' ',
      'OR sh.full_name LIKE ''%', p_search, '%'' ',
      'OR CAST(c.complaint_id AS CHAR) LIKE ''%', p_search, '%'')');
  END IF;
  
  -- Add ordering
  SET @sql = CONCAT(@sql, ' ORDER BY c.created_at DESC');
  
  -- Execute the query
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- =============================================
-- Update complaint status
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateComplaintStatus$$
CREATE PROCEDURE sp_updateComplaintStatus(
  IN p_complaint_id INT,
  IN p_status VARCHAR(20),
  IN p_resolution_notes TEXT,
  IN p_resolved_by INT
)
BEGIN
  UPDATE complaint 
  SET 
    status = p_status,
    resolution_notes = p_resolution_notes,
    resolved_by = p_resolved_by,
    resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- Success message
SELECT 'Complaint management stored procedures created successfully' as status;