-- =============================================
-- 408: Complaint Management Stored Procedures
-- Created: Auto-generated for 100% SP compliance
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
    sender_name VARCHAR(255),
    sender_contact VARCHAR(50),
    sender_email VARCHAR(255),
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
-- Get stallholder details for complaint
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallholderDetailsForComplaint$$
CREATE PROCEDURE sp_getStallholderDetailsForComplaint(
  IN p_stallholder_id INT
)
BEGIN
  -- First try stallholder table
  SELECT 
    stallholder_name as sender_name,
    contact_number as sender_contact,
    email as sender_email,
    branch_id,
    stall_id,
    'stallholder' as source
  FROM stallholder 
  WHERE stallholder_id = p_stallholder_id OR applicant_id = p_stallholder_id
  LIMIT 1;
END$$

-- =============================================
-- Get applicant details for complaint fallback
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDetailsForComplaint$$
CREATE PROCEDURE sp_getApplicantDetailsForComplaint(
  IN p_applicant_id INT
)
BEGIN
  SELECT 
    applicant_full_name as sender_name,
    applicant_contact_number as sender_contact,
    applicant_email as sender_email,
    NULL as branch_id,
    NULL as stall_id,
    'applicant' as source
  FROM applicant 
  WHERE applicant_id = p_applicant_id
  LIMIT 1;
END$$

-- =============================================
-- Insert new complaint
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertComplaint$$
CREATE PROCEDURE sp_insertComplaint(
  IN p_complaint_type VARCHAR(100),
  IN p_sender_name VARCHAR(255),
  IN p_sender_contact VARCHAR(50),
  IN p_sender_email VARCHAR(255),
  IN p_stallholder_id INT,
  IN p_stall_id INT,
  IN p_branch_id INT,
  IN p_subject VARCHAR(255),
  IN p_description TEXT,
  IN p_evidence LONGBLOB
)
BEGIN
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
    p_evidence,
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
