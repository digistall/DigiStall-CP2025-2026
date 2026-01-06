-- Migration: 127_setBranchDocumentRequirement.sql
-- Description: setBranchDocumentRequirement stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `setBranchDocumentRequirement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `setBranchDocumentRequirement` (IN `p_branch_id` INT, IN `p_document_type_id` INT, IN `p_is_required` TINYINT, IN `p_instructions` TEXT, IN `p_created_by_manager` INT)   BEGIN
    DECLARE v_requirement_id INT DEFAULT 0;
    DECLARE v_affected_rows INT DEFAULT 0;
    
    SELECT requirement_id INTO v_requirement_id
    FROM branch_document_requirements
    WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id
    LIMIT 1;
    
    IF v_requirement_id > 0 THEN
        UPDATE branch_document_requirements
        SET 
            is_required = p_is_required,
            instructions = p_instructions,
            created_by_business_manager = p_created_by_manager,
            created_at = CURRENT_TIMESTAMP
        WHERE requirement_id = v_requirement_id;
        
        SET v_affected_rows = ROW_COUNT();
        
        SELECT 
            v_requirement_id as requirement_id,
            'updated' as operation,
            v_affected_rows as affected_rows,
            'Document requirement updated successfully' as message;
    ELSE
        INSERT INTO branch_document_requirements (
            branch_id,
            document_type_id,
            is_required,
            instructions,
            created_by_business_manager,
            created_at
        ) VALUES (
            p_branch_id,
            p_document_type_id,
            p_is_required,
            p_instructions,
            p_created_by_manager,
            CURRENT_TIMESTAMP
        );
        
        SET v_requirement_id = LAST_INSERT_ID();
        SET v_affected_rows = ROW_COUNT();
        
        SELECT 
            v_requirement_id as requirement_id,
            'created' as operation,
            v_affected_rows as affected_rows,
            'Document requirement created successfully' as message;
    END IF;
END$$

DELIMITER ;
