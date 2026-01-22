-- ===== CREATE MISSING STORED PROCEDURES =====
-- This SQL script creates the missing decrypted stored procedures for complaints and compliance
-- These procedures are needed by the web backend controllers

USE naga_stall;

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS `getAllComplaintsDecrypted`;

DROP PROCEDURE IF EXISTS `getAllComplianceRecordsDecrypted`;

-- ===== CREATE getAllComplaintsDecrypted PROCEDURE =====

CREATE PROCEDURE `getAllComplaintsDecrypted`(
  IN p_branch_id INT,
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(255)
)
BEGIN
  -- Build and execute dynamic query based on filters
  -- Using actual table name: complaint (singular)
  SET @sql = 'SELECT 
    c.complaint_id,
    c.complainant_type,
    c.complainant_id,
    c.complainant_name,
    c.complainant_contact,
    c.complained_id,
    c.complained_type,
    c.complaint_type,
    c.complaint_details,
    c.branch_id,
    c.status,
    c.resolved_by,
    c.resolved_at,
    c.resolution_notes,
    c.created_at,
    c.updated_at
  FROM complaint c
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
      ' AND (c.complaint_details LIKE ''%', p_search, '%'' ',
      'OR c.complainant_name LIKE ''%', p_search, '%'' ',
      'OR c.complaint_type LIKE ''%', p_search, '%'')');
  END IF;
  
  -- Add ordering
  SET @sql = CONCAT(@sql, ' ORDER BY c.created_at DESC');
  
  -- Execute the query
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END;

-- ===== CREATE getAllComplianceRecordsDecrypted PROCEDURE =====
-- Note: Using 'violation_report' table for compliance/violation records

CREATE PROCEDURE `getAllComplianceRecordsDecrypted`(
  IN p_branch_id INT,
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(255)
)
BEGIN
  -- Build and execute dynamic query based on filters
  -- Using actual table: violation_report joined with violation, stallholder, stall, inspector, branch
  SET @sql = 'SELECT 
    vr.report_id,
    vr.report_id as compliance_id,
    vr.stallholder_id,
    vr.violation_id,
    vr.reported_by,
    vr.reported_by as inspector_id,
    vr.report_date,
    vr.report_date as date,
    vr.report_date as inspection_date,
    vr.offense_count,
    vr.offense_count as offense_no,
    vr.penalty_amount,
    vr.payment_status,
    vr.paid_date,
    vr.paid_date as payment_date,
    vr.remarks,
    vr.status,
    vr.created_at,
    v.violation_type,
    v.violation_type as type,
    v.description as violation_description,
    v.description as violation_details,
    v.default_penalty,
    sh.full_name as stallholder_name,
    sh.full_name as stallholder,
    sh.email as stallholder_email,
    sh.contact_number as stallholder_contact,
    s.stall_number,
    s.stall_number as stall_no,
    s.stall_id,
    s.stall_location,
    sh.branch_id,
    b.branch_name,
    b.area as branch_area,
    i.first_name as inspector_first_name,
    i.last_name as inspector_last_name
  FROM violation_report vr
  LEFT JOIN violation v ON vr.violation_id = v.violation_id
  LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
  LEFT JOIN stall s ON sh.stall_id = s.stall_id
  LEFT JOIN branch b ON sh.branch_id = b.branch_id
  LEFT JOIN inspector i ON vr.reported_by = i.inspector_id
  WHERE 1=1';
  
  -- Add branch filter if provided
  IF p_branch_id IS NOT NULL THEN
    SET @sql = CONCAT(@sql, ' AND sh.branch_id = ', p_branch_id);
  END IF;
  
  -- Add status filter if provided
  IF p_status IS NOT NULL AND p_status != 'all' THEN
    SET @sql = CONCAT(@sql, ' AND vr.status = ''', p_status, '''');
  END IF;
  
  -- Add search filter if provided
  IF p_search IS NOT NULL AND p_search != '' THEN
    SET @sql = CONCAT(@sql, 
      ' AND (v.violation_type LIKE ''%', p_search, '%'' ',
      'OR v.description LIKE ''%', p_search, '%'' ',
      'OR vr.remarks LIKE ''%', p_search, '%'' ',
      'OR sh.full_name LIKE ''%', p_search, '%'' ',
      'OR b.branch_name LIKE ''%', p_search, '%'' ',
      'OR i.first_name LIKE ''%', p_search, '%'' ',
      'OR i.last_name LIKE ''%', p_search, '%'')');
  END IF;
  
  -- Add ordering
  SET @sql = CONCAT(@sql, ' ORDER BY vr.report_date DESC');
  
  -- Execute the query
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END;

-- Verify procedures were created
SELECT 
  ROUTINE_NAME as 'Created Procedure',
  CREATED as 'Creation Time'
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall'
  AND ROUTINE_TYPE = 'PROCEDURE'
  AND ROUTINE_NAME IN ('getAllComplaintsDecrypted', 'getAllComplianceRecordsDecrypted')
ORDER BY ROUTINE_NAME;
