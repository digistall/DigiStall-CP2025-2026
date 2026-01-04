-- Migration: 160_sp_deleteApplicantCascade.sql
-- Description: sp_deleteApplicantCascade stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteApplicantCascade`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteApplicantCascade` (IN `p_applicant_id` INT)   BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Delete from application table first
  DELETE FROM application WHERE applicant_id = p_applicant_id;
  
  -- Delete from other_information
  DELETE FROM other_information WHERE applicant_id = p_applicant_id;
  
  -- Delete from business_information
  DELETE FROM business_information WHERE applicant_id = p_applicant_id;
  
  -- Delete from spouse
  DELETE FROM spouse WHERE applicant_id = p_applicant_id;
  
  -- Delete from credential
  DELETE FROM credential WHERE applicant_id = p_applicant_id;
  
  -- Delete from applicant_documents
  DELETE FROM applicant_documents WHERE applicant_id = p_applicant_id;
  
  -- Finally delete from applicant table
  DELETE FROM applicant WHERE applicant_id = p_applicant_id;
  
  COMMIT;
  
  SELECT p_applicant_id as deleted_applicant_id;
END$$

DELIMITER ;
