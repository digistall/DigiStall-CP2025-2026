-- Comprehensive fix for stall table column mismatches
-- The stall table uses 'stall_number' not 'stall_no'

USE naga_stall;

-- Show actual stall table structure for reference
DESCRIBE stall;

-- Fix getApplicantApplicationsDetailed procedure
DROP PROCEDURE IF EXISTS `getApplicantApplicationsDetailed`;

DELIMITER $$

CREATE PROCEDURE `getApplicantApplicationsDetailed` (IN `p_applicant_id` INT)
BEGIN
    SELECT 
        app.application_id,
        app.applicant_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        app.updated_at,
        s.stall_number,
        s.stall_size,
        s.monthly_rent,
        s.status as stall_status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC;
END$$

DELIMITER ;

-- Fix getAvailableStallsByApplicant procedure
DROP PROCEDURE IF EXISTS `getAvailableStallsByApplicant`;

DELIMITER $$

CREATE PROCEDURE `getAvailableStallsByApplicant` (IN `p_applicant_id` INT)
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_size,
        s.monthly_rent,
        s.status,
        s.is_available,
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status,
        CASE 
            WHEN app.application_id IS NOT NULL THEN 'applied'
            WHEN s.is_available = 1 AND s.status = 'Available' THEN 'available'
            ELSE 'unavailable'
        END as application_status
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN application app ON s.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
    WHERE b.status = 'Active'
    ORDER BY b.area, b.branch_name, s.stall_number;
END$$

DELIMITER ;

-- Verify procedures were created successfully
SHOW CREATE PROCEDURE getApplicantApplicationsDetailed\G
SHOW CREATE PROCEDURE getAvailableStallsByApplicant\G
