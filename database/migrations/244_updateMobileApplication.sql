-- Migration: 244_updateMobileApplication.sql
-- Description: updateMobileApplication stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateMobileApplication`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateMobileApplication` (IN `p_application_id` INT, IN `p_applicant_id` INT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_preferred_area` VARCHAR(255), IN `p_document_urls` TEXT)   BEGIN
    UPDATE applications 
    SET business_name = p_business_name, 
        business_type = p_business_type, 
        preferred_area = p_preferred_area, 
        document_urls = p_document_urls, 
        updated_at = NOW() 
    WHERE application_id = p_application_id 
      AND applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
