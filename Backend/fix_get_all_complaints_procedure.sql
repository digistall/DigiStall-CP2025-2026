-- Fix getAllComplaintsDecrypted procedure
-- Remove reference to non-existent 'complainant_type' column

DELIMITER $$

DROP PROCEDURE IF EXISTS getAllComplaintsDecrypted$$
CREATE PROCEDURE getAllComplaintsDecrypted(
  IN p_branch_id INT,
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(255)
)
BEGIN
  DECLARE encryption_key VARCHAR(32) DEFAULT 'your-secret-encryption-key-32';
  
  -- Build dynamic query based on filters with decryption
  SET @sql = 'SELECT 
    c.complaint_id,
    c.complaint_type,
    CAST(AES_DECRYPT(c.sender_name, ''your-secret-encryption-key-32'') AS CHAR) as sender_name,
    CAST(AES_DECRYPT(c.sender_contact, ''your-secret-encryption-key-32'') AS CHAR) as sender_contact,
    CAST(AES_DECRYPT(c.sender_email, ''your-secret-encryption-key-32'') AS CHAR) as sender_email,
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
    CAST(AES_DECRYPT(sh.full_name, ''your-secret-encryption-key-32'') AS CHAR) as stallholder_name,
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

DELIMITER ;

SELECT 'getAllComplaintsDecrypted procedure updated successfully' as status;
