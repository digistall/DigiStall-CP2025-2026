-- Migration: 055_getAllSubscriptionPlans.sql
-- Description: getAllSubscriptionPlans stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllSubscriptionPlans`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllSubscriptionPlans` ()   BEGIN
    SELECT 
        plan_id,
        plan_name,
        plan_description,
        monthly_fee,
        max_branches,
        max_employees,
        features,
        status,
        created_at
    FROM subscription_plans
    WHERE status = 'Active'
    ORDER BY monthly_fee ASC;
END$$

DELIMITER ;
