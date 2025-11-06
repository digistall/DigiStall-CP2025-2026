-- Migration: Fix deleteBranch to handle all foreign key constraints
-- Version: 1.0.1
-- Description: Update deleteBranch to properly handle all cascade deletes including stalls
-- Date: 2025-11-05

DROP PROCEDURE IF EXISTS deleteBranch;

DELIMITER $$

CREATE PROCEDURE deleteBranch (IN p_branch_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        -- Get the last error message
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT CONCAT('Error: ', @text) AS error_message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Check if branch exists
    IF NOT EXISTS (SELECT 1 FROM branch WHERE branch_id = p_branch_id) THEN
        SELECT 0 as affected_rows, 'Branch not found' as message;
        ROLLBACK;
    ELSE
        -- Delete in correct order to avoid foreign key constraints
        
        -- 1. Delete stalls and their dependencies first
        -- Auctions, raffles, applications will cascade automatically
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
        
        -- 5. Delete stallholders associated with this branch
        DELETE FROM stallholder WHERE branch_id = p_branch_id;
        
        -- 6. Finally, delete the branch itself
        DELETE FROM branch WHERE branch_id = p_branch_id;
        
        COMMIT;
        
        SELECT ROW_COUNT() as affected_rows, 'Branch deleted successfully' as message;
    END IF;
END$$

DELIMITER ;

-- Update migration record
UPDATE migrations 
SET version = '1.0.1', executed_at = NOW() 
WHERE migration_name = '013_fix_branch_procedures';
