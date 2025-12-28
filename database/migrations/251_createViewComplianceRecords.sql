-- Migration: 251_createViewComplianceRecords.sql
-- Description: Create or replace view_compliance_records view that joins violation_report with related tables
-- Date: December 27, 2025

-- Drop existing view if it exists
DROP VIEW IF EXISTS `view_compliance_records`;

-- Create the view that joins all related tables to get actual text values
CREATE VIEW `view_compliance_records` AS 
SELECT 
    `vr`.`report_id` AS `compliance_id`, 
    `vr`.`date_reported` AS `date`, 
    COALESCE(`vr`.`compliance_type`, `v`.`violation_type`) AS `type`, 
    CONCAT(`i`.`first_name`, ' ', `i`.`last_name`) AS `inspector`, 
    `sh`.`stallholder_name` AS `stallholder`, 
    `vr`.`status` AS `status`, 
    `vr`.`severity` AS `severity`, 
    `vr`.`remarks` AS `notes`, 
    `vr`.`resolved_date` AS `resolved_date`, 
    `b`.`branch_name` AS `branch_name`, 
    `b`.`branch_id` AS `branch_id`, 
    `s`.`stall_no` AS `stall_no`, 
    `vr`.`offense_no` AS `offense_no`, 
    `vp`.`penalty_amount` AS `penalty_amount`, 
    `vr`.`stallholder_id` AS `stallholder_id`, 
    `vr`.`stall_id` AS `stall_id`, 
    `vr`.`inspector_id` AS `inspector_id`, 
    `vr`.`violation_id` AS `violation_id`,
    `vr`.`evidence` AS `evidence`,
    `vr`.`receipt_number` AS `receipt_number`,
    `vr`.`payment_date` AS `payment_date`,
    `vr`.`payment_reference` AS `payment_reference`,
    `vr`.`paid_amount` AS `paid_amount`,
    `vr`.`collected_by` AS `collected_by`,
    `v`.`ordinance_no` AS `ordinance_no`,
    `v`.`details` AS `violation_details`,
    `vp`.`remarks` AS `penalty_remarks`,
    `sh`.`compliance_status` AS `stallholder_compliance_status`,
    `sh`.`contact_number` AS `stallholder_contact`,
    `sh`.`email` AS `stallholder_email`
FROM `violation_report` `vr`
LEFT JOIN `inspector` `i` ON `vr`.`inspector_id` = `i`.`inspector_id`
LEFT JOIN `stallholder` `sh` ON `vr`.`stallholder_id` = `sh`.`stallholder_id`
LEFT JOIN `violation` `v` ON `vr`.`violation_id` = `v`.`violation_id`
LEFT JOIN `branch` `b` ON `vr`.`branch_id` = `b`.`branch_id`
LEFT JOIN `stall` `s` ON `vr`.`stall_id` = `s`.`stall_id`
LEFT JOIN `violation_penalty` `vp` ON `vr`.`penalty_id` = `vp`.`penalty_id`
ORDER BY `vr`.`date_reported` DESC;
