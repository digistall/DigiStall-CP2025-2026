-- Migration 011: checkStallAvailability procedure
-- Description: Checks the availability of a specific stall
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `checkStallAvailability`$$

CREATE PROCEDURE `checkStallAvailability` (IN `p_stall_id` INT)
BEGIN
    SELECT stall_id, stall_name, area, branch_id, is_available 
    FROM stalls 
    WHERE stall_id = p_stall_id;
END$$

DELIMITER ;
