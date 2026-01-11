-- Migration: 191_sp_getDocumentTypeByRequirementId.sql
-- Description: sp_getDocumentTypeByRequirementId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getDocumentTypeByRequirementId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getDocumentTypeByRequirementId` (IN `p_requirement_id` INT)   BEGIN
  SELECT document_type_id FROM branch_document_requirements WHERE requirement_id = p_requirement_id LIMIT 1;
END$$

DELIMITER ;
