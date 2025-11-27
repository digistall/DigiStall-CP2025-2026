-- Test file for views only
-- Drop existing views first
DROP VIEW IF EXISTS `active_auctions_view`;
DROP VIEW IF EXISTS `active_raffles_view`;
DROP VIEW IF EXISTS `stalls_with_raffle_auction_view`;

-- Create active_auctions_view
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_auctions_view` AS 
SELECT 
    `a`.`auction_id` AS `auction_id`,
    `a`.`stall_id` AS `stall_id`,
    `s`.`stall_no` AS `stall_no`,
    `s`.`stall_location` AS `stall_location`,
    `a`.`starting_price` AS `starting_price`,
    `a`.`current_highest_bid` AS `current_highest_bid`,
    `a`.`total_bids` AS `total_bids`,
    `b`.`branch_name` AS `branch_name`,
    `f`.`floor_name` AS `floor_name`,
    `sec`.`section_name` AS `section_name`,
    `a`.`start_time` AS `start_time`,
    `a`.`end_time` AS `end_time`,
    `a`.`application_deadline` AS `application_deadline`,
    `a`.`auction_status` AS `auction_status`,
    CASE 
        WHEN `a`.`end_time` IS NULL THEN NULL 
        ELSE TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP(), `a`.`end_time`) 
    END AS `seconds_remaining`,
    CASE 
        WHEN `a`.`end_time` IS NULL THEN 'Waiting for bidders'
        WHEN CURRENT_TIMESTAMP() >= `a`.`end_time` THEN 'Expired'
        ELSE CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP(), `a`.`end_time`) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP(), `a`.`end_time`) MOD 3600) / 60), 'm ',
            TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP(), `a`.`end_time`) MOD 60, 's'
        )
    END AS `time_remaining_formatted`,
    `hb`.`applicant_full_name` AS `highest_bidder_name`,
    `bm`.`first_name` AS `manager_first_name`,
    `bm`.`last_name` AS `manager_last_name`
FROM 
    `auction` `a`
    JOIN `stall` `s` ON `a`.`stall_id` = `s`.`stall_id`
    JOIN `section` `sec` ON `s`.`section_id` = `sec`.`section_id`
    JOIN `floor` `f` ON `s`.`floor_id` = `f`.`floor_id`
    JOIN `branch` `b` ON `f`.`branch_id` = `b`.`branch_id`
    JOIN `branch_manager` `bm` ON `a`.`created_by_manager` = `bm`.`branch_manager_id`
    LEFT JOIN `applicant` `hb` ON `a`.`highest_bidder_id` = `hb`.`applicant_id`
WHERE 
    `a`.`auction_status` IN ('Waiting for Bidders', 'Active');
