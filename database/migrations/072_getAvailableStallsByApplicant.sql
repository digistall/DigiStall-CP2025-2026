-- Migration: 072_getAvailableStallsByApplicant.sql
-- Description: getAvailableStallsByApplicant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAvailableStallsByApplicant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAvailableStallsByApplicant` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no as stall_number,
        s.size as stall_size,
        s.rental_price as monthly_rent,
        s.status,
        s.is_available,
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status,
        CASE 
            WHEN app.application_id IS NOT NULL THEN 'applied'
            WHEN s.is_available = 1 AND s.status = 'Active' THEN 'available'
            ELSE 'unavailable'
        END as application_status
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN application app ON s.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
    WHERE s.status = 'Active' 
      AND b.status = 'Active'
    ORDER BY b.area, b.branch_name, s.stall_no;
END$$

DELIMITER ;
