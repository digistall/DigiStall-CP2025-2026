-- Migration: 115_registerMobileUser.sql
-- Description: registerMobileUser stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `registerMobileUser`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerMobileUser` (IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_username` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_password_hash` VARCHAR(255))   BEGIN
    INSERT INTO applicant (
        applicant_full_name, 
        applicant_contact_number, 
        applicant_address,
        applicant_username, 
        applicant_email, 
        applicant_password_hash,
        email_verified,
        created_at
    ) VALUES (
        p_full_name, 
        p_contact_number, 
        p_address, 
        p_username, 
        p_email, 
        p_password_hash,
        FALSE, 
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as applicant_id;
END$$

DELIMITER ;
