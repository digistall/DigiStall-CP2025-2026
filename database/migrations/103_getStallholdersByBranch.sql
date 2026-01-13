-- Migration: 103_getStallholdersByBranch.sql
-- Description: getStallholdersByBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallholdersByBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholdersByBranch` (IN `p_branch_id` INT)   BEGIN
        IF p_branch_id IS NULL THEN
            SELECT 
                s.stallholder_id,
                s.stallholder_name,
                s.contact_number,
                s.business_name,
                s.business_type,
                s.contract_status,
                s.branch_id,
                st.stall_no,
                st.stall_location,
                b.branch_name
            FROM stallholder s
            LEFT JOIN stall st ON s.stall_id = st.stall_id
            LEFT JOIN branch b ON s.branch_id = b.branch_id
            WHERE s.contract_status = 'Active'
            ORDER BY s.stallholder_name ASC;
        ELSE
            SELECT 
                s.stallholder_id,
                s.stallholder_name,
                s.contact_number,
                s.business_name,
                s.business_type,
                s.contract_status,
                s.branch_id,
                st.stall_no,
                st.stall_location,
                b.branch_name
            FROM stallholder s
            LEFT JOIN stall st ON s.stall_id = st.stall_id
            LEFT JOIN branch b ON s.branch_id = b.branch_id
            WHERE s.contract_status = 'Active' AND s.branch_id = p_branch_id
            ORDER BY s.stallholder_name ASC;
        END IF;
    END$$

DELIMITER ;
