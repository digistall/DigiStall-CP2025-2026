-- Migration: 199_sp_getLandingPageFilterOptions.sql
-- Description: sp_getLandingPageFilterOptions stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLandingPageFilterOptions`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageFilterOptions` ()   BEGIN
    -- Return branches
    SELECT branch_id, branch_name FROM branch ORDER BY branch_name;
    
    -- Return distinct business types
    SELECT DISTINCT business_type FROM stallholder WHERE business_type IS NOT NULL AND business_type != '' ORDER BY business_type;
    
    -- Return stall statuses (including occupancy options)
    SELECT 'Active' as status UNION SELECT 'Inactive' UNION SELECT 'Maintenance' UNION SELECT 'Occupied' UNION SELECT 'Available';
    
    -- Return price types
    SELECT 'Fixed Price' as price_type UNION SELECT 'Auction' UNION SELECT 'Raffle';
END$$

DELIMITER ;
