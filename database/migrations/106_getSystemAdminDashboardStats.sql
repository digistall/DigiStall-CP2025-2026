-- Migration: 106_getSystemAdminDashboardStats.sql
-- Description: getSystemAdminDashboardStats stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getSystemAdminDashboardStats`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSystemAdminDashboardStats` ()   BEGIN
    -- Total business owners
    SELECT COUNT(*) as total_business_owners FROM stall_business_owner;
    
    -- Active subscriptions
    SELECT COUNT(*) as active_subscriptions 
    FROM stall_business_owner 
    WHERE subscription_status = 'Active';
    
    -- Expiring soon (within 7 days)
    SELECT COUNT(*) as expiring_soon 
    FROM stall_business_owner 
    WHERE subscription_status = 'Active' 
    AND DATEDIFF(subscription_expiry_date, CURDATE()) <= 7
    AND subscription_expiry_date >= CURDATE();
    
    -- Expired subscriptions
    SELECT COUNT(*) as expired_subscriptions 
    FROM stall_business_owner 
    WHERE subscription_expiry_date < CURDATE();
    
    -- Total revenue this month
    SELECT COALESCE(SUM(amount), 0) as revenue_this_month
    FROM subscription_payments
    WHERE payment_status = 'Completed'
    AND MONTH(payment_date) = MONTH(CURDATE())
    AND YEAR(payment_date) = YEAR(CURDATE());
    
    -- Total revenue all time
    SELECT COALESCE(SUM(amount), 0) as total_revenue
    FROM subscription_payments
    WHERE payment_status = 'Completed';
    
    -- Pending payments
    SELECT COUNT(*) as pending_payments
    FROM stall_business_owner
    WHERE subscription_status = 'Pending';
END$$

DELIMITER ;
