-- Migration: 088_getManagerBusinessOwners.sql
-- Description: getManagerBusinessOwners stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getManagerBusinessOwners`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getManagerBusinessOwners` (IN `p_business_manager_id` INT)   BEGIN
    SELECT 
        bom.relationship_id,
        bom.business_owner_id,
        bom.is_primary,
        bom.access_level,
        bom.assigned_date,
        sbo.owner_username,
        CONCAT(sbo.first_name, ' ', sbo.last_name) as owner_name,
        sbo.email as owner_email,
        sbo.contact_number as owner_contact,
        sbo.status as owner_status,
        sbo.subscription_status,
        sbo.subscription_expiry_date,
        DATEDIFF(sbo.subscription_expiry_date, CURDATE()) as days_until_expiry,
        s.subscription_id,
        sp.plan_name,
        sp.monthly_fee
    FROM business_owner_managers bom
    INNER JOIN stall_business_owner sbo ON bom.business_owner_id = sbo.business_owner_id
    LEFT JOIN business_owner_subscriptions s ON sbo.business_owner_id = s.business_owner_id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.plan_id
    WHERE bom.business_manager_id = p_business_manager_id
      AND bom.status = 'Active'
    ORDER BY bom.is_primary DESC, sbo.created_at DESC;
END$$

DELIMITER ;
