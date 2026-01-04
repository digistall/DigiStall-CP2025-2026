-- Migration: 162_sp_deleteBranchDocumentRequirements.sql
-- Description: sp_deleteBranchDocumentRequirements stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteBranchDocumentRequirements`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteBranchDocumentRequirements` (IN `p_branch_id` INT)   BEGIN
  DELETE FROM branch_document_requirements WHERE branch_id = p_branch_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
