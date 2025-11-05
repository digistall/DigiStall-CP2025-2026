-- =====================================================
-- Missing Stored Procedures for DigiStall Application
-- Created: November 5, 2025
-- Purpose: Add missing CRUD stored procedures
-- =====================================================

DELIMITER $$

-- =====================================================
-- ADMIN PROCEDURES
-- =====================================================

-- Get admin by username
CREATE PROCEDURE IF NOT EXISTS `getAdminByUsernameLogin`(IN `p_username` VARCHAR(50))
BEGIN
    SELECT * FROM admin WHERE admin_username = p_username AND status = 'Active';
END$$

-- =====================================================
-- BRANCH MANAGER PROCEDURES
-- =====================================================

-- Get branch manager by username
CREATE PROCEDURE IF NOT EXISTS `getBranchManagerByUsername`(IN `p_username` VARCHAR(50))
BEGIN
    SELECT 
        bm.*,
        b.branch_name,
        b.area,
        b.location
    FROM branch_manager bm
    LEFT JOIN branch b ON bm.branch_id = b.branch_id
    WHERE bm.manager_username = p_username AND bm.status = 'Active';
END$$

-- Update branch manager
CREATE PROCEDURE IF NOT EXISTS `updateBranchManager`(
    IN `p_manager_id` INT,
    IN `p_first_name` VARCHAR(50),
    IN `p_last_name` VARCHAR(50),
    IN `p_email` VARCHAR(100),
    IN `p_contact_number` VARCHAR(20),
    IN `p_status` ENUM('Active','Inactive')
)
BEGIN
    UPDATE branch_manager
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        contact_number = COALESCE(p_contact_number, contact_number),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE branch_manager_id = p_manager_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================
-- APPLICANT PROCEDURES (Already exist - just listing for reference)
-- =====================================================
-- createApplicant - EXISTS
-- getApplicantById - EXISTS
-- getAllApplicants - EXISTS

-- Update applicant
CREATE PROCEDURE IF NOT EXISTS `updateApplicant`(
    IN `p_applicant_id` INT,
    IN `p_full_name` VARCHAR(255),
    IN `p_contact_number` VARCHAR(20),
    IN `p_address` TEXT,
    IN `p_birthdate` DATE,
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'),
    IN `p_educational_attainment` VARCHAR(100)
)
BEGIN
    UPDATE applicant
    SET 
        applicant_full_name = COALESCE(p_full_name, applicant_full_name),
        applicant_contact_number = COALESCE(p_contact_number, applicant_contact_number),
        applicant_address = COALESCE(p_address, applicant_address),
        applicant_birthdate = COALESCE(p_birthdate, applicant_birthdate),
        applicant_civil_status = COALESCE(p_civil_status, applicant_civil_status),
        applicant_educational_attainment = COALESCE(p_educational_attainment, applicant_educational_attainment),
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Get applicant by username (for mobile login)
CREATE PROCEDURE IF NOT EXISTS `getApplicantByUsername`(IN `p_username` VARCHAR(50))
BEGIN
    SELECT * FROM applicant WHERE applicant_username = p_username;
END$$

-- Get applicant by email
CREATE PROCEDURE IF NOT EXISTS `getApplicantByEmail`(IN `p_email` VARCHAR(100))
BEGIN
    SELECT * FROM applicant WHERE applicant_email = p_email;
END$$

-- Delete applicant (soft delete)
CREATE PROCEDURE IF NOT EXISTS `deleteApplicant`(IN `p_applicant_id` INT)
BEGIN
    -- Archive or mark as deleted
    UPDATE applicant SET updated_at = NOW() WHERE applicant_id = p_applicant_id;
    DELETE FROM applicant WHERE applicant_id = p_applicant_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================
-- APPLICATION PROCEDURES
-- =====================================================

-- Create application
CREATE PROCEDURE IF NOT EXISTS `createApplication`(
    IN `p_stall_id` INT,
    IN `p_applicant_id` INT,
    IN `p_application_date` DATE,
    IN `p_application_status` ENUM('Pending','Under Review','Approved','Rejected','Cancelled')
)
BEGIN
    INSERT INTO application (stall_id, applicant_id, application_date, application_status)
    VALUES (p_stall_id, p_applicant_id, p_application_date, p_application_status);
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

-- Get all applications
CREATE PROCEDURE IF NOT EXISTS `getAllApplications`()
BEGIN
    SELECT 
        a.*,
        ap.applicant_full_name,
        ap.applicant_contact_number,
        s.stall_no,
        s.stall_location,
        b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY a.created_at DESC;
END$$

-- Get application by ID
CREATE PROCEDURE IF NOT EXISTS `getApplicationById`(IN `p_application_id` INT)
BEGIN
    SELECT 
        a.*,
        ap.applicant_full_name,
        ap.applicant_contact_number,
        ap.applicant_email,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.application_id = p_application_id;
END$$

-- Update application status
CREATE PROCEDURE IF NOT EXISTS `updateApplicationStatus`(
    IN `p_application_id` INT,
    IN `p_status` ENUM('Pending','Under Review','Approved','Rejected','Cancelled')
)
BEGIN
    UPDATE application
    SET application_status = p_status, updated_at = NOW()
    WHERE application_id = p_application_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Get applications by applicant
CREATE PROCEDURE IF NOT EXISTS `getApplicationsByApplicant`(IN `p_applicant_id` INT)
BEGIN
    SELECT 
        a.*,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM application a
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.applicant_id = p_applicant_id
    ORDER BY a.created_at DESC;
END$$

-- =====================================================
-- STALL PROCEDURES
-- =====================================================

-- Get all stalls
CREATE PROCEDURE IF NOT EXISTS `getAllStallsDetailed`()
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY b.branch_name, f.floor_name, sec.section_name;
END$$

-- Update stall
CREATE PROCEDURE IF NOT EXISTS `updateStall`(
    IN `p_stall_id` INT,
    IN `p_stall_no` VARCHAR(20),
    IN `p_stall_location` VARCHAR(100),
    IN `p_size` VARCHAR(50),
    IN `p_rental_price` DECIMAL(10,2),
    IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'),
    IN `p_description` TEXT
)
BEGIN
    UPDATE stall
    SET 
        stall_no = COALESCE(p_stall_no, stall_no),
        stall_location = COALESCE(p_stall_location, stall_location),
        size = COALESCE(p_size, size),
        rental_price = COALESCE(p_rental_price, rental_price),
        status = COALESCE(p_status, status),
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Delete stall (soft delete)
CREATE PROCEDURE IF NOT EXISTS `deleteStall`(IN `p_stall_id` INT)
BEGIN
    UPDATE stall SET status = 'Inactive', updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================
-- BRANCH PROCEDURES
-- =====================================================

-- Create branch
CREATE PROCEDURE IF NOT EXISTS `createBranch`(
    IN `p_admin_id` INT,
    IN `p_branch_name` VARCHAR(100),
    IN `p_area` VARCHAR(100),
    IN `p_location` VARCHAR(255),
    IN `p_address` TEXT,
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(100)
)
BEGIN
    INSERT INTO branch (admin_id, branch_name, area, location, address, contact_number, email)
    VALUES (p_admin_id, p_branch_name, p_area, p_location, p_address, p_contact_number, p_email);
    
    SELECT LAST_INSERT_ID() as branch_id;
END$$

-- Get all branches
CREATE PROCEDURE IF NOT EXISTS `getAllBranchesDetailed`()
BEGIN
    SELECT * FROM branch ORDER BY branch_name;
END$$

-- Get branch by ID
CREATE PROCEDURE IF NOT EXISTS `getBranchById`(IN `p_branch_id` INT)
BEGIN
    SELECT * FROM branch WHERE branch_id = p_branch_id;
END$$

-- Update branch
CREATE PROCEDURE IF NOT EXISTS `updateBranch`(
    IN `p_branch_id` INT,
    IN `p_branch_name` VARCHAR(100),
    IN `p_area` VARCHAR(100),
    IN `p_location` VARCHAR(255),
    IN `p_address` TEXT,
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(100),
    IN `p_status` ENUM('Active','Inactive','Under Construction','Maintenance')
)
BEGIN
    UPDATE branch
    SET 
        branch_name = COALESCE(p_branch_name, branch_name),
        area = COALESCE(p_area, area),
        location = COALESCE(p_location, location),
        address = COALESCE(p_address, address),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE branch_id = p_branch_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Delete branch (soft delete)
CREATE PROCEDURE IF NOT EXISTS `deleteBranch`(IN `p_branch_id` INT)
BEGIN
    UPDATE branch SET status = 'Inactive', updated_at = NOW()
    WHERE branch_id = p_branch_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================
-- FLOOR PROCEDURES
-- =====================================================

-- Create floor
CREATE PROCEDURE IF NOT EXISTS `createFloor`(
    IN `p_branch_id` INT,
    IN `p_floor_name` VARCHAR(50),
    IN `p_floor_number` INT
)
BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number)
    VALUES (p_branch_id, p_floor_name, p_floor_number);
    
    SELECT LAST_INSERT_ID() as floor_id;
END$$

-- Get floors by branch
CREATE PROCEDURE IF NOT EXISTS `getFloorsByBranch`(IN `p_branch_id` INT)
BEGIN
    SELECT * FROM floor WHERE branch_id = p_branch_id ORDER BY floor_number;
END$$

-- =====================================================
-- SECTION PROCEDURES
-- =====================================================

-- Create section
CREATE PROCEDURE IF NOT EXISTS `createSection`(
    IN `p_floor_id` INT,
    IN `p_section_name` VARCHAR(100)
)
BEGIN
    INSERT INTO section (floor_id, section_name)
    VALUES (p_floor_id, p_section_name);
    
    SELECT LAST_INSERT_ID() as section_id;
END$$

-- Get sections by floor
CREATE PROCEDURE IF NOT EXISTS `getSectionsByFloor`(IN `p_floor_id` INT)
BEGIN
    SELECT * FROM section WHERE floor_id = p_floor_id ORDER BY section_name;
END$$

-- =====================================================
-- CREDENTIAL PROCEDURES (for mobile)
-- =====================================================

-- Get credential by applicant ID
CREATE PROCEDURE IF NOT EXISTS `getCredentialByApplicantId`(IN `p_applicant_id` INT)
BEGIN
    SELECT * FROM credential WHERE applicant_id = p_applicant_id;
END$$

-- Update last login
CREATE PROCEDURE IF NOT EXISTS `updateCredentialLastLogin`(IN `p_applicant_id` INT)
BEGIN
    UPDATE credential SET last_login = NOW() WHERE applicant_id = p_applicant_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- =====================================================
-- Record migration
-- =====================================================
INSERT INTO migrations (migration_name, version, executed_at)
VALUES ('010_missing_stored_procedures', '1.0.0', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();
