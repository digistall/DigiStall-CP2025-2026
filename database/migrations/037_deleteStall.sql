-- Migration: 037_deleteStall.sql
-- Description: deleteStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStall` (IN `p_stall_id` INT)   BEGIN
    UPDATE stall SET status = 'Inactive', updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
