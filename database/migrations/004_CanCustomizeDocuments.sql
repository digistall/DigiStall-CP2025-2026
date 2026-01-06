-- Migration: 004_CanCustomizeDocuments.sql
-- Description: Checks if a business manager can customize documents (based on active status)
-- Date: Generated from naga_stall.sql
-- NOTE: Modified to use business_manager_id instead of owner_id

DELIMITER $$

DROP PROCEDURE IF EXISTS `CanCustomizeDocuments`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CanCustomizeDocuments` (IN `p_business_manager_id` INT, OUT `can_customize` BOOLEAN)   BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM business_manager 
        WHERE business_manager_id = p_business_manager_id 
          AND status = 'Active'
    ) INTO can_customize;
END$$

DELIMITER ;
