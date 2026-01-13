-- Migration: 082_getComplaintById.sql
-- Description: getComplaintById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getComplaintById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplaintById` (IN `p_complaint_id` INT)   BEGIN
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_id,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    sh.stallholder_name,
    sh.contact_number AS stallholder_contact,
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
  WHERE c.complaint_id = p_complaint_id;
END$$

DELIMITER ;
