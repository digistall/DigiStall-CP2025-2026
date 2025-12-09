-- Migration: 049_getAllComplianceRecords.sql
-- Description: getAllComplianceRecords stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllComplianceRecords`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllComplianceRecords` (IN `p_branch_id` INT, IN `p_status` VARCHAR(20), IN `p_search` VARCHAR(255))   BEGIN
  SELECT * FROM `view_compliance_records`
  WHERE 
    (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR status = p_status)
    AND (
      p_search IS NULL OR p_search = '' OR
      compliance_id LIKE CONCAT('%', p_search, '%') OR
      type LIKE CONCAT('%', p_search, '%') OR
      inspector LIKE CONCAT('%', p_search, '%') OR
      stallholder LIKE CONCAT('%', p_search, '%')
    )
  ORDER BY date DESC;
END$$

DELIMITER ;
