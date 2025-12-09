-- Migration: 081_getBusinessOwnerSubscription.sql
-- Description: getBusinessOwnerSubscription stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessOwnerSubscription`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessOwnerSubscription` (IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        s.subscription_id,
        s.subscription_status,
        s.start_date,
        s.end_date,
        s.auto_renew,
        p.plan_name,
        p.plan_description,
        p.monthly_fee,
        p.max_branches,
        p.max_employees,
        p.features,
        DATEDIFF(s.end_date, CURDATE()) as days_remaining,
        bo.subscription_expiry_date,
        bo.last_payment_date
    FROM business_owner_subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.plan_id
    JOIN stall_business_owner bo ON s.business_owner_id = bo.business_owner_id
    WHERE s.business_owner_id = p_business_owner_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END$$

DELIMITER ;
