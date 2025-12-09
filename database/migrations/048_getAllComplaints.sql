-- Migration: 048_getAllComplaints.sql
-- Description: getAllComplaints stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllComplaints`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllComplaints` (IN `p_branch_id` INT, IN `p_status` VARCHAR(20), IN `p_search` VARCHAR(255))   BEGIN
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_id,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    sh.stallholder_name,
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
  WHERE 
    (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR c.status = p_status)
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

DELIMITER ;
