-- ============================================================================
-- COMPREHENSIVE CRUD STORED PROCEDURES FOR DIGISTALL SYSTEM
-- Date: November 5, 2025
-- Purpose: Migrate all CRUD operations to stored procedures
-- ============================================================================

USE naga_stall;

DELIMITER $$

-- ============================================================================
-- APPLICANT PROCEDURES
-- ============================================================================

-- Create Applicant
DROP PROCEDURE IF EXISTS createApplicantComplete$$
CREATE PROCEDURE createApplicantComplete(
    IN p_full_name VARCHAR(255),
    IN p_contact_number VARCHAR(20),
    IN p_address TEXT,
    IN p_birthdate DATE,
    IN p_civil_status ENUM('Single','Married','Divorced','Widowed'),
    IN p_educational_attainment VARCHAR(100),
    IN p_email VARCHAR(100),
    -- Business Info
    IN p_nature_of_business VARCHAR(255),
    IN p_capitalization DECIMAL(15,2),
    IN p_source_of_capital VARCHAR(255),
    IN p_previous_business_experience TEXT,
    -- Spouse Info (optional)
    IN p_spouse_full_name VARCHAR(255),
    IN p_spouse_birthdate DATE,
    IN p_spouse_educational_attainment VARCHAR(100),
    IN p_spouse_contact_number VARCHAR(20),
    IN p_spouse_occupation VARCHAR(100),
    -- Other Info
    IN p_signature VARCHAR(500),
    IN p_house_sketch VARCHAR(500),
    IN p_valid_id VARCHAR(500)
)
BEGIN
    DECLARE v_applicant_id INT;
    
    -- Insert applicant
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment,
        applicant_email
    ) VALUES (
        p_full_name, p_contact_number, p_address,
        p_birthdate, p_civil_status, p_educational_attainment,
        p_email
    );
    
    SET v_applicant_id = LAST_INSERT_ID();
    
    -- Insert business information
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience
    ) VALUES (
        v_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience
    );
    
    -- Insert spouse info if provided
    IF p_spouse_full_name IS NOT NULL THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            v_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        );
    END IF;
    
    -- Insert other information
    INSERT INTO other_information (
        applicant_id, signature_of_applicant, house_sketch_location, valid_id, email_address
    ) VALUES (
        v_applicant_id, p_signature, p_house_sketch, p_valid_id, p_email
    );
    
    SELECT v_applicant_id as applicant_id;
END$$

-- Get Applicant with all details
DROP PROCEDURE IF EXISTS getApplicantComplete$$
CREATE PROCEDURE getApplicantComplete(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        a.*,
        b.business_id, b.nature_of_business, b.capitalization,
        b.source_of_capital, b.previous_business_experience,
        s.spouse_id, s.spouse_full_name, s.spouse_birthdate,
        s.spouse_educational_attainment, s.spouse_contact_number, s.spouse_occupation,
        o.other_info_id, o.signature_of_applicant, o.house_sketch_location,
        o.valid_id, o.email_address
    FROM applicant a
    LEFT JOIN business_information b ON a.applicant_id = b.applicant_id
    LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
    LEFT JOIN other_information o ON a.applicant_id = o.applicant_id
    WHERE a.applicant_id = p_applicant_id;
END$$

-- Update Applicant
DROP PROCEDURE IF EXISTS updateApplicantComplete$$
CREATE PROCEDURE updateApplicantComplete(
    IN p_applicant_id INT,
    IN p_full_name VARCHAR(255),
    IN p_contact_number VARCHAR(20),
    IN p_address TEXT,
    IN p_birthdate DATE,
    IN p_civil_status ENUM('Single','Married','Divorced','Widowed'),
    IN p_educational_attainment VARCHAR(100)
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

-- Delete Applicant (soft delete if needed, or cascade)
DROP PROCEDURE IF EXISTS deleteApplicant$$
CREATE PROCEDURE deleteApplicant(
    IN p_applicant_id INT
)
BEGIN
    -- Delete related records first due to foreign key constraints
    DELETE FROM other_information WHERE applicant_id = p_applicant_id;
    DELETE FROM spouse WHERE applicant_id = p_applicant_id;
    DELETE FROM business_information WHERE applicant_id = p_applicant_id;
    DELETE FROM application WHERE applicant_id = p_applicant_id;
    DELETE FROM applicant WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- ============================================================================
-- STALL PROCEDURES
-- ============================================================================

-- Get Stalls with filters
DROP PROCEDURE IF EXISTS getStallsFiltered$$
CREATE PROCEDURE getStallsFiltered(
    IN p_branch_id INT,
    IN p_floor_id INT,
    IN p_section_id INT,
    IN p_status VARCHAR(20),
    IN p_price_type VARCHAR(20),
    IN p_is_available TINYINT
)
BEGIN
    SET @sql = 'SELECT 
        s.stall_id, s.stall_no, s.stall_location, s.size, s.rental_price,
        s.price_type, s.status, s.stamp, s.description, s.stall_image,
        s.is_available, s.raffle_auction_deadline, s.raffle_auction_status,
        sec.section_id, sec.section_name,
        f.floor_id, f.floor_name, f.floor_number,
        b.branch_id, b.branch_name, b.area, b.location
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE 1=1';
    
    IF p_branch_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND b.branch_id = ', p_branch_id);
    END IF;
    
    IF p_floor_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND f.floor_id = ', p_floor_id);
    END IF;
    
    IF p_section_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND sec.section_id = ', p_section_id);
    END IF;
    
    IF p_status IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.status = "', p_status, '"');
    END IF;
    
    IF p_price_type IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.price_type = "', p_price_type, '"');
    END IF;
    
    IF p_is_available IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.is_available = ', p_is_available);
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY b.branch_name, f.floor_number, sec.section_name, s.stall_no');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- Create Stall
DROP PROCEDURE IF EXISTS createStall$$
CREATE PROCEDURE createStall(
    IN p_section_id INT,
    IN p_floor_id INT,
    IN p_stall_no VARCHAR(20),
    IN p_stall_location VARCHAR(100),
    IN p_size VARCHAR(50),
    IN p_rental_price DECIMAL(10,2),
    IN p_price_type ENUM('Fixed Price','Auction','Raffle'),
    IN p_status VARCHAR(20),
    IN p_stamp VARCHAR(100),
    IN p_description TEXT,
    IN p_stall_image VARCHAR(500),
    IN p_created_by_manager INT
)
BEGIN
    INSERT INTO stall (
        section_id, floor_id, stall_no, stall_location, size, rental_price,
        price_type, status, stamp, description, stall_image, is_available,
        created_by_manager
    ) VALUES (
        p_section_id, p_floor_id, p_stall_no, p_stall_location, p_size, p_rental_price,
        p_price_type, p_status, p_stamp, p_description, p_stall_image, 1,
        p_created_by_manager
    );
    
    SELECT LAST_INSERT_ID() as stall_id;
END$$

-- Update Stall
DROP PROCEDURE IF EXISTS updateStall$$
CREATE PROCEDURE updateStall(
    IN p_stall_id INT,
    IN p_stall_location VARCHAR(100),
    IN p_size VARCHAR(50),
    IN p_rental_price DECIMAL(10,2),
    IN p_status VARCHAR(20),
    IN p_description TEXT,
    IN p_stall_image VARCHAR(500),
    IN p_is_available TINYINT
)
BEGIN
    UPDATE stall 
    SET 
        stall_location = COALESCE(p_stall_location, stall_location),
        size = COALESCE(p_size, size),
        rental_price = COALESCE(p_rental_price, rental_price),
        status = COALESCE(p_status, status),
        description = COALESCE(p_description, description),
        stall_image = COALESCE(p_stall_image, stall_image),
        is_available = COALESCE(p_is_available, is_available),
        updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Delete Stall
DROP PROCEDURE IF EXISTS deleteStall$$
CREATE PROCEDURE deleteStall(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall 
    SET status = 'Inactive', is_available = 0, updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- ============================================================================
-- APPLICATION PROCEDURES
-- ============================================================================

-- Create Application
DROP PROCEDURE IF EXISTS createApplication$$
CREATE PROCEDURE createApplication(
    IN p_stall_id INT,
    IN p_applicant_id INT,
    IN p_application_date DATE
)
BEGIN
    INSERT INTO application (
        stall_id, applicant_id, application_date, application_status
    ) VALUES (
        p_stall_id, p_applicant_id, p_application_date, 'Pending'
    );
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

-- Get Applications by Applicant
DROP PROCEDURE IF EXISTS getApplicationsByApplicant$$
CREATE PROCEDURE getApplicationsByApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        app.application_id,
        app.stall_id,
        app.application_date,
        app.application_status,
        app.created_at,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        s.price_type,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area
    FROM application app
    JOIN stall s ON app.stall_id = s.stall_id
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.created_at DESC;
END$$

-- Get Applications by Stall
DROP PROCEDURE IF EXISTS getApplicationsByStall$$
CREATE PROCEDURE getApplicationsByStall(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        app.application_id,
        app.applicant_id,
        app.application_date,
        app.application_status,
        app.created_at,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_email
    FROM application app
    JOIN applicant a ON app.applicant_id = a.applicant_id
    WHERE app.stall_id = p_stall_id
    ORDER BY app.created_at DESC;
END$$

-- Update Application Status
DROP PROCEDURE IF EXISTS updateApplicationStatus$$
CREATE PROCEDURE updateApplicationStatus(
    IN p_application_id INT,
    IN p_status ENUM('Pending','Under Review','Approved','Rejected','Cancelled')
)
BEGIN
    UPDATE application 
    SET 
        application_status = p_status,
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Delete Application
DROP PROCEDURE IF EXISTS deleteApplication$$
CREATE PROCEDURE deleteApplication(
    IN p_application_id INT
)
BEGIN
    DELETE FROM application WHERE application_id = p_application_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

-- ============================================================================
-- BRANCH PROCEDURES
-- ============================================================================

-- Get All Branches
DROP PROCEDURE IF EXISTS getAllBranches$$
CREATE PROCEDURE getAllBranches()
BEGIN
    SELECT 
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        b.address,
        b.contact_number,
        b.email,
        b.status,
        b.created_at,
        COUNT(DISTINCT f.floor_id) as floor_count,
        COUNT(DISTINCT s.stall_id) as stall_count
    FROM branch b
    LEFT JOIN floor f ON b.branch_id = f.branch_id
    LEFT JOIN stall s ON f.floor_id = s.floor_id
    WHERE b.status = 'Active'
    GROUP BY b.branch_id
    ORDER BY b.branch_name;
END$$

-- Get Branch by ID
DROP PROCEDURE IF EXISTS getBranchById$$
CREATE PROCEDURE getBranchById(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        b.*,
        COUNT(DISTINCT f.floor_id) as floor_count,
        COUNT(DISTINCT s.stall_id) as stall_count,
        COUNT(DISTINCT CASE WHEN s.is_available = 1 THEN s.stall_id END) as available_stalls
    FROM branch b
    LEFT JOIN floor f ON b.branch_id = f.branch_id
    LEFT JOIN stall s ON f.floor_id = s.floor_id
    WHERE b.branch_id = p_branch_id
    GROUP BY b.branch_id;
END$$

-- ============================================================================
-- CREDENTIAL PROCEDURES (for mobile app)
-- ============================================================================

-- Create Credentials
DROP PROCEDURE IF EXISTS createCredential$$
CREATE PROCEDURE createCredential(
    IN p_applicant_id INT,
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    INSERT INTO credential (
        applicant_id, user_name, password_hash, is_active
    ) VALUES (
        p_applicant_id, p_username, p_password_hash, 1
    );
    
    SELECT LAST_INSERT_ID() as registrationid;
END$$

-- Get Credential by Username
DROP PROCEDURE IF EXISTS getCredentialByUsername$$
CREATE PROCEDURE getCredentialByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        c.*,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number
    FROM credential c
    JOIN applicant a ON c.applicant_id = a.applicant_id
    WHERE c.user_name = p_username AND c.is_active = 1;
END$$

-- Update Last Login
DROP PROCEDURE IF EXISTS updateLastLogin$$
CREATE PROCEDURE updateLastLogin(
    IN p_registrationid INT
)
BEGIN
    UPDATE credential 
    SET last_login = NOW()
    WHERE registrationid = p_registrationid;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON PROCEDURE naga_stall.createApplicantComplete TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getApplicantComplete TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.updateApplicantComplete TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.deleteApplicant TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getStallsFiltered TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.createStall TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.updateStall TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.deleteStall TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.createApplication TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getApplicationsByApplicant TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getApplicationsByStall TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.updateApplicationStatus TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.deleteApplication TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getAllBranches TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getBranchById TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.createCredential TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.getCredentialByUsername TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE naga_stall.updateLastLogin TO 'root'@'localhost';

FLUSH PRIVILEGES;

-- ============================================================================
-- END OF COMPREHENSIVE CRUD PROCEDURES
-- ============================================================================
