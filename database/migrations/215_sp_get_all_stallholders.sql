-- Migration: 215_sp_get_all_stallholders.sql
-- Description: sp_get_all_stallholders stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_all_stallholders`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_all_stallholders` (IN `p_branch_id` INT)   BEGIN
                SELECT 
                    sh.stallholder_id as id,
                    sh.stallholder_name as name,
                    sh.contact_number as contact,
                    sh.business_name as businessName,
                    COALESCE(st.stall_no, 'N/A') as stallNo,
                    COALESCE(st.stall_location, 'N/A') as stallLocation,
                    COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
                    COALESCE(b.branch_name, 'Unknown') as branchName,
                    sh.payment_status as paymentStatus
                FROM stallholder sh
                LEFT JOIN stall st ON sh.stall_id = st.stall_id
                LEFT JOIN branch b ON sh.branch_id = b.branch_id
                WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
                  AND sh.contract_status = 'Active'
                  AND sh.payment_status != 'paid'
                ORDER BY sh.stallholder_name ASC;
            END$$

DELIMITER ;
