-- ===== FIX getAllComplaintsDecrypted PROCEDURE =====
-- Issue: The procedure needs to handle encrypted data properly
-- Based on complaint table structure from fix_complaint_table.sql
-- Date: January 23, 2026

USE test_digistall;

DELIMITER $$

DROP PROCEDURE IF EXISTS getAllComplaintsDecrypted$$

CREATE PROCEDURE getAllComplaintsDecrypted(
  IN p_branch_id INT,
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(255)
)
BEGIN
  -- Select complaints with proper column names
  -- No decryption needed in stored procedure - backend will handle it
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
    c.created_at as date,
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
  
  -- Add search filter if provided (search in encrypted fields too)
  IF p_search IS NOT NULL AND p_search != '' THEN
    SET @sql = CONCAT(@sql, 
      ' AND (c.subject LIKE ''%', p_search, '%'' ',
      'OR c.description LIKE ''%', p_search, '%'' ',
      'OR c.sender_name LIKE ''%', p_search, '%'' ',
      'OR c.sender_contact LIKE ''%', p_search, '%'' ',
      'OR c.sender_email LIKE ''%', p_search, '%'' ',
      'OR c.complaint_type LIKE ''%', p_search, '%'' ',
      'OR sh.full_name LIKE ''%', p_search, '%'' ',
      'OR b.branch_name LIKE ''%', p_search, '%'' ',
      'OR s.stall_number LIKE ''%', p_search, '%'' ',
      'OR CAST(c.complaint_id AS CHAR) LIKE ''%', p_search, '%'')');
  END IF;
  
  -- Add ordering
  SET @sql = CONCAT(@sql, ' ORDER BY c.created_at DESC');
  
  -- Execute the query
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- Test the procedure
-- CALL getAllComplaintsDecrypted(NULL, 'all', NULL);

SELECT '✅ getAllComplaintsDecrypted procedure fixed and ready!' as Status;
