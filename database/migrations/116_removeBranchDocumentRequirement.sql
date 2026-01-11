-- Migration: 116_removeBranchDocumentRequirement.sql
-- Description: removeBranchDocumentRequirement stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `removeBranchDocumentRequirement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeBranchDocumentRequirement` (IN `p_branch_id` INT, IN `p_document_type_id` INT)   BEGIN
    DECLARE v_affected_rows INT DEFAULT 0;
    
    DELETE FROM branch_document_requirements
    WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id;
    
    SET v_affected_rows = ROW_COUNT();
    
    SELECT 
        v_affected_rows as affected_rows,
        'deleted' as operation,
        CASE 
            WHEN v_affected_rows > 0 THEN 'Document requirement deleted successfully'
            ELSE 'No document requirement found to delete'
        END as message;
END$$

DELIMITER ;
