-- Migration: 118_removeManagerFromBusinessOwner.sql
-- Description: removeManagerFromBusinessOwner stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `removeManagerFromBusinessOwner`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeManagerFromBusinessOwner` (IN `p_relationship_id` INT)   BEGIN
    DECLARE v_is_primary TINYINT(1);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error removing manager from business owner';
    END;
    
    START TRANSACTION;
    
    
    SELECT is_primary INTO v_is_primary
    FROM business_owner_managers
    WHERE relationship_id = p_relationship_id;
    
    
    IF v_is_primary = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot remove primary manager. Assign a new primary manager first.';
    END IF;
    
    
    UPDATE business_owner_managers
    SET status = 'Inactive',
        updated_at = NOW()
    WHERE relationship_id = p_relationship_id;
    
    COMMIT;
    
    SELECT 
        ROW_COUNT() as affected_rows,
        'Manager removed successfully' as message;
END$$

DELIMITER ;
