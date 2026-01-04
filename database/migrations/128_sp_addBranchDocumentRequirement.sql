-- Migration: 128_sp_addBranchDocumentRequirement.sql
-- Description: sp_addBranchDocumentRequirement stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_addBranchDocumentRequirement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addBranchDocumentRequirement` (IN `p_branch_id` INT, IN `p_document_type_id` INT, IN `p_is_required` TINYINT)   BEGIN
  INSERT INTO branch_document_requirements (branch_id, document_type_id, is_required)
  VALUES (p_branch_id, p_document_type_id, p_is_required);
  
  SELECT LAST_INSERT_ID() as requirement_id;
END$$

DELIMITER ;
