-- Migration: 078_getBusinessManagerByUsername.sql
-- Description: getBusinessManagerByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessManagerByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessManagerByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        bm.*,
        b.`branch_name`,
        b.`area`,
        b.`location`
    FROM `business_manager` bm
    LEFT JOIN `branch` b ON bm.`branch_id` = b.`branch_id`
    WHERE bm.`manager_username` = p_username AND bm.`status` = 'Active';
END$$

DELIMITER ;
