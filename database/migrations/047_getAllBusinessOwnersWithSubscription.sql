-- Migration: 047_getAllBusinessOwnersWithSubscription.sql
-- Description: getAllBusinessOwnersWithSubscription stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllBusinessOwnersWithSubscription`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBusinessOwnersWithSubscription` ()   BEGIN
    SELECT 
        bo.business_owner_id,
        bo.owner_username,
        CONCAT(bo.first_name, ' ', bo.last_name) as full_name,
        bo.first_name,
        bo.last_name,
        bo.email,
        bo.contact_number,
        bo.status,
        bo.subscription_status,
        bo.subscription_expiry_date,
        bo.last_payment_date,
        DATEDIFF(bo.subscription_expiry_date, CURDATE()) as days_until_expiry,
        s.subscription_id,
        p.plan_name,
        p.monthly_fee,
        CASE 
            WHEN bo.subscription_expiry_date < CURDATE() THEN 'Expired'
            WHEN DATEDIFF(bo.subscription_expiry_date, CURDATE()) <= 7 THEN 'Expiring Soon'
            ELSE 'Active'
        END as payment_status
    FROM stall_business_owner bo
    LEFT JOIN business_owner_subscriptions s ON bo.business_owner_id = s.business_owner_id
    LEFT JOIN subscription_plans p ON s.plan_id = p.plan_id
    ORDER BY bo.created_at DESC;
END$$

DELIMITER ;
