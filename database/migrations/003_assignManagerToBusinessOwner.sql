-- Migration: 003_assignManagerToBusinessOwner.sql
-- Description: Assigns a business manager to a business owner
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `assignManagerToBusinessOwner`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `assignManagerToBusinessOwner` (IN `p_business_owner_id` INT, IN `p_business_manager_id` INT, IN `p_access_level` VARCHAR(20), IN `p_assigned_by_system_admin` INT, IN `p_notes` TEXT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error assigning manager to business owner';
    END;
    
    START TRANSACTION;
    
    INSERT INTO business_owner_managers (
        business_owner_id,
        business_manager_id,
        is_primary,
        access_level,
        assigned_by_system_admin,
        notes
    ) VALUES (
        p_business_owner_id,
        p_business_manager_id,
        0, 
        COALESCE(p_access_level, 'Full'),
        p_assigned_by_system_admin,
        p_notes
    );
    
    COMMIT;
    
    SELECT 
        LAST_INSERT_ID() as relationship_id,
        'Manager assigned successfully' as message;
END$$

DELIMITER ;
