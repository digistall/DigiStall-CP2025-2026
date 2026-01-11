-- Migration: 101_getStallholderById.sql
-- Description: getStallholderById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallholderById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholderById` (IN `p_stallholder_id` INT)   BEGIN
    SELECT 
        sh.`stallholder_id`,
        sh.`applicant_id`,
        sh.`stallholder_name`,
        sh.`contact_number`,
        sh.`email`,
        sh.`address`,
        sh.`business_name`,
        sh.`business_type`,
        sh.`branch_id`,
        b.`branch_name`,
        sh.`stall_id`,
        s.`stall_no`,
        s.`stall_location`,
        sh.`contract_start_date`,
        sh.`contract_end_date`,
        sh.`contract_status`,
        sh.`lease_amount`,
        sh.`monthly_rent`,
        sh.`payment_status`,
        sh.`last_payment_date`,
        sh.`compliance_status`,
        sh.`last_violation_date`,
        sh.`notes`,
        sh.`date_created`,
        sh.`updated_at`,
        CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name,
        a.`applicant_full_name`,
        a.`applicant_contact_number`,
        a.`applicant_address`,
        a.`applicant_birthdate`,
        a.`applicant_civil_status`,
        a.`applicant_educational_attainment`
    FROM `stallholder` sh
    LEFT JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
    LEFT JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
    LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
    LEFT JOIN `applicant` a ON sh.`applicant_id` = a.`applicant_id`
    WHERE sh.`stallholder_id` = p_stallholder_id;
END$$

DELIMITER ;
