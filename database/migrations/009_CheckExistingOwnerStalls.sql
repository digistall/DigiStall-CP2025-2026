-- Migration 009: CheckExistingOwnerStalls procedure
-- Description: Retrieves existing owner stalls for a given stallholder
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `CheckExistingOwnerStalls`$$

CREATE PROCEDURE `CheckExistingOwnerStalls` (IN `p_stallholder_id` INT)
BEGIN
    SELECT 
        s.business_owner_id as owner_id,
        sbo.owner_full_name as owner_name,
        sbo.owner_email as owner_email,
        COUNT(DISTINCT s.stall_id) as stall_count,
        GROUP_CONCAT(DISTINCT b.branch_name SEPARATOR ', ') as branches
    FROM stall s
    INNER JOIN stall_business_owner sbo ON s.business_owner_id = sbo.business_owner_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.stallholder_id = p_stallholder_id
    GROUP BY s.business_owner_id, sbo.owner_full_name, sbo.owner_email;
END$$

DELIMITER ;
