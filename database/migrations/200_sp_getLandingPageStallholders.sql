-- Migration: 200_sp_getLandingPageStallholders.sql
-- Description: sp_getLandingPageStallholders stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLandingPageStallholders`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageStallholders` (IN `p_search` VARCHAR(255), IN `p_branch_filter` INT, IN `p_business_type_filter` VARCHAR(100), IN `p_page` INT, IN `p_limit` INT)   BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;
    
    -- Return stallholders with their stall and branch info
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.business_type,
        sh.contact_number,
        sh.email,
        s.stall_no,
        s.stall_location,
        b.branch_name,
        b.branch_id,
        sh.contract_status,
        sh.compliance_status
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.contract_status = 'Active'
    AND (p_search IS NULL OR p_search = '' OR 
         sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
         sh.business_name LIKE CONCAT('%', p_search, '%') OR
         sh.business_type LIKE CONCAT('%', p_search, '%') OR
         s.stall_no LIKE CONCAT('%', p_search, '%') OR
         b.branch_name LIKE CONCAT('%', p_search, '%'))
    AND (p_branch_filter IS NULL OR p_branch_filter = 0 OR sh.branch_id = p_branch_filter)
    AND (p_business_type_filter IS NULL OR p_business_type_filter = '' OR sh.business_type = p_business_type_filter)
    ORDER BY sh.stallholder_name ASC
    LIMIT p_limit OFFSET v_offset;
END$$

DELIMITER ;
