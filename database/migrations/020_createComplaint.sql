-- Migration: 020_createComplaint.sql
-- Description: createComplaint stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createComplaint` (IN `p_complaint_type` VARCHAR(100), IN `p_sender_name` VARCHAR(255), IN `p_sender_contact` VARCHAR(50), IN `p_sender_email` VARCHAR(255), IN `p_stallholder_id` INT, IN `p_stall_id` INT, IN `p_branch_id` INT, IN `p_subject` VARCHAR(255), IN `p_description` TEXT, IN `p_evidence` TEXT, IN `p_priority` VARCHAR(20))   BEGIN
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
    priority,
    status
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
    COALESCE(p_priority, 'medium'),
    'pending'
  );
  
  SELECT LAST_INSERT_ID() AS complaint_id;
END$$

DELIMITER ;
