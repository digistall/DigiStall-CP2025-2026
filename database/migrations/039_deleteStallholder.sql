-- Migration: 039_deleteStallholder.sql
-- Description: deleteStallholder stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteStallholder`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStallholder` (IN `p_stallholder_id` INT)   BEGIN
    DECLARE stall_to_free INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    SELECT stall_id INTO stall_to_free FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    
    UPDATE stallholder 
    SET contract_status = 'Terminated', updated_at = CURRENT_TIMESTAMP
    WHERE stallholder_id = p_stallholder_id;
    
    
    IF stall_to_free IS NOT NULL THEN
        UPDATE stall 
        SET status = 'Active', is_available = 1 
        WHERE stall_id = stall_to_free;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder contract terminated successfully' AS message, ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
