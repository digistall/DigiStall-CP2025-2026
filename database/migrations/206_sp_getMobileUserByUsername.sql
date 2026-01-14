-- Migration: 206_sp_getMobileUserByUsername.sql
-- Description: sp_getMobileUserByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getMobileUserByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getMobileUserByUsername` (IN `p_username` VARCHAR(100))   BEGIN
  SELECT 
    c.credential_id,
    c.applicant_id,
    c.username,
    c.password,
    c.status AS credential_status,
    a.applicant_id,
    a.applicant_full_name,
    a.applicant_gender,
    a.applicant_birthday,
    a.applicant_civil_status,
    a.applicant_nationality,
    a.applicant_religion,
    a.applicant_address,
    a.applicant_contact_number,
    a.applicant_email,
    a.applicant_status
  FROM credential c
  INNER JOIN applicant a ON c.applicant_id = a.applicant_id
  WHERE c.username = p_username AND c.status = 'Active';
END$$

DELIMITER ;
