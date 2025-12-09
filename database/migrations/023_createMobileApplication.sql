-- Migration: 023_createMobileApplication.sql
-- Description: createMobileApplication stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createMobileApplication`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createMobileApplication` (IN `p_applicant_id` INT, IN `p_stall_id` INT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_preferred_area` VARCHAR(255), IN `p_document_urls` TEXT)   BEGIN
    INSERT INTO applications 
    (applicant_id, stall_id, business_name, business_type, preferred_area, 
     document_urls, status, created_at) 
    VALUES (p_applicant_id, p_stall_id, p_business_name, p_business_type, 
            p_preferred_area, p_document_urls, 'pending', NOW());
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

DELIMITER ;
