-- Migration: 217_sp_get_stallholders_for_manager.sql
-- Description: sp_get_stallholders_for_manager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_stallholders_for_manager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_stallholders_for_manager` (IN `p_manager_id` INT)   BEGIN
    DECLARE manager_branch_id INT DEFAULT NULL;
    
    -- Get the branch ID for the manager
    SELECT branch_id INTO manager_branch_id 
    FROM branch_manager 
    WHERE branch_manager_id = p_manager_id;
    
    IF manager_branch_id IS NULL THEN
        SELECT 'No stallholders found for this manager' as message;
    ELSE
        SELECT 
            sh.stallholder_id as stallholderId,
            sh.stallholder_name as stallholderName,
            COALESCE(st.stall_no, 'N/A') as stallNo,
            sh.contact_number as contactNumber,
            sh.contract_status as status,
            b.branch_name as branchName,
            sh.branch_id as branchId
        FROM stallholder sh
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id = manager_branch_id
        AND sh.contract_status = 'Active'
        ORDER BY sh.stallholder_name ASC;
    END IF;
END$$

DELIMITER ;
