-- Migration: 045_getAllBranchesDetailed.sql
-- Description: getAllBranchesDetailed stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllBranchesDetailed`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBranchesDetailed` ()   BEGIN
    SELECT 
        b.`branch_id`,
        b.`business_owner_id`,
        b.`branch_name`,
        b.`area`,
        b.`location`,
        b.`address`,
        b.`contact_number`,
        b.`email`,
        b.`status`,
        b.`created_at`,
        b.`updated_at`,
        bm.`business_manager_id` as manager_id,
        bm.`manager_username`,
        CONCAT(bm.`first_name`, ' ', bm.`last_name`) as manager_name,
        CASE 
            WHEN bm.`business_manager_id` IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END as manager_assigned,
        bm.`email` as manager_email,
        bm.`contact_number` as manager_contact,
        bm.`status` as manager_status
    FROM `branch` b
    LEFT JOIN `business_manager` bm ON b.`branch_id` = bm.`branch_id` AND bm.`status` = 'Active'
    ORDER BY b.`branch_name`;
END$$

DELIMITER ;
