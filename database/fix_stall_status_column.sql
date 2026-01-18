-- Fix the stall_status column issue in getApplicantApplicationsDetailed procedure
-- This fixes the "Unknown column 's.stall_status' in 'field list'" error

USE naga_stall;

-- Check current stall table structure
DESCRIBE stall;

-- Drop and recreate the procedure with correct column reference
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
        s.stall_no as stall_number,
        s.size as stall_size,
        s.rental_price as monthly_rent,
        s.status as stall_status,  -- This is correct - 'status' column aliased as 'stall_status'
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

-- Verify the procedure was created successfully
SHOW CREATE PROCEDURE getApplicantApplicationsDetailed\G

-- Test the procedure (replace 5 with actual applicant_id)
-- CALL getApplicantApplicationsDetailed(5);
