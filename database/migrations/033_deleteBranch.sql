-- Migration: 033_deleteBranch.sql
-- Description: deleteBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteBranch` (IN `p_branch_id` INT)   BEGIN
    DECLARE branch_exists INT DEFAULT 0;
    DECLARE rows_deleted INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as affected_rows, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    SELECT COUNT(*) INTO branch_exists FROM branch WHERE branch_id = p_branch_id;
    
    IF branch_exists = 0 THEN
        SELECT 0 as affected_rows, 'Branch not found' as message;
        ROLLBACK;
    ELSE
        
        
        
        DELETE FROM stall 
        WHERE section_id IN (
            SELECT section_id FROM section 
            WHERE floor_id IN (
                SELECT floor_id FROM floor WHERE branch_id = p_branch_id
            )
        );
        
        
        DELETE FROM section 
        WHERE floor_id IN (
            SELECT floor_id FROM floor WHERE branch_id = p_branch_id
        );
        
        
        DELETE FROM floor WHERE branch_id = p_branch_id;
        
        
        DELETE FROM branch_manager WHERE branch_id = p_branch_id;
        
        
        DELETE FROM stallholder WHERE branch_id = p_branch_id;
        
        
        DELETE FROM branch WHERE branch_id = p_branch_id;
        SET rows_deleted = ROW_COUNT();
        
        COMMIT;
        
        SELECT rows_deleted as affected_rows, 'Branch deleted successfully' as message;
    END IF;
END$$

DELIMITER ;
