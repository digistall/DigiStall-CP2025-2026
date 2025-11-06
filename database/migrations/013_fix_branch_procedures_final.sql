-- Migration: Fix deleteBranch - Final Version
-- Version: 1.0.2
-- Description: Properly return affected_rows for branch deletion
-- Date: 2025-11-05

DROP PROCEDURE IF EXISTS deleteBranch;

DELIMITER $$

CREATE PROCEDURE deleteBranch (IN p_branch_id INT)
BEGIN
    DECLARE branch_exists INT DEFAULT 0;
    DECLARE rows_deleted INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as affected_rows, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Check if branch exists
    SELECT COUNT(*) INTO branch_exists FROM branch WHERE branch_id = p_branch_id;
    
    IF branch_exists = 0 THEN
        SELECT 0 as affected_rows, 'Branch not found' as message;
        ROLLBACK;
    ELSE
        -- Delete in correct order to avoid foreign key constraints
        
        -- 1. Delete stalls and their dependencies
        DELETE FROM stall 
        WHERE section_id IN (
            SELECT section_id FROM section 
            WHERE floor_id IN (
                SELECT floor_id FROM floor WHERE branch_id = p_branch_id
            )
        );
        
        -- 2. Delete sections
        DELETE FROM section 
        WHERE floor_id IN (
            SELECT floor_id FROM floor WHERE branch_id = p_branch_id
        );
        
        -- 3. Delete floors
        DELETE FROM floor WHERE branch_id = p_branch_id;
        
        -- 4. Delete branch managers
        DELETE FROM branch_manager WHERE branch_id = p_branch_id;
        
        -- 5. Delete stallholders
        DELETE FROM stallholder WHERE branch_id = p_branch_id;
        
        -- 6. Delete the branch itself and capture affected rows
        DELETE FROM branch WHERE branch_id = p_branch_id;
        SET rows_deleted = ROW_COUNT();
        
        COMMIT;
        
        SELECT rows_deleted as affected_rows, 'Branch deleted successfully' as message;
    END IF;
END$$

DELIMITER ;

-- Update migration record
UPDATE migrations 
SET version = '1.0.2', executed_at = NOW() 
WHERE migration_name = '013_fix_branch_procedures';
