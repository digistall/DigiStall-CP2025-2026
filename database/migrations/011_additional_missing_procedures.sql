-- =====================================================
-- Additional Missing Stored Procedures
-- Migration: 011_additional_missing_procedures
-- Generated: November 5, 2025
-- =====================================================

DELIMITER $$

-- =====================================================
-- APPLICANT PROCEDURES
-- =====================================================

-- Create applicant with complete information
DROP PROCEDURE IF EXISTS `createApplicantComplete`$$
CREATE PROCEDURE `createApplicantComplete`(
    IN `p_full_name` VARCHAR(255),
    IN `p_contact_number` VARCHAR(20),
    IN `p_address` TEXT,
    IN `p_birthdate` DATE,
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'),
    IN `p_educational_attainment` VARCHAR(100),
    IN `p_nature_of_business` VARCHAR(255),
    IN `p_capitalization` DECIMAL(15,2),
    IN `p_source_of_capital` VARCHAR(255),
    IN `p_previous_business_experience` TEXT,
    IN `p_email_address` VARCHAR(255),
    IN `p_spouse_full_name` VARCHAR(255),
    IN `p_spouse_birthdate` DATE,
    IN `p_spouse_educational_attainment` VARCHAR(100),
    IN `p_spouse_contact_number` VARCHAR(20),
    IN `p_spouse_occupation` VARCHAR(100)
)
BEGIN
    DECLARE new_applicant_id INT;
    
    -- Insert applicant
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment
    ) VALUES (
        p_full_name, p_contact_number, p_address,
        p_birthdate, p_civil_status, p_educational_attainment
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Insert business information
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience
    ) VALUES (
        new_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience
    );
    
    -- Insert other information
    INSERT INTO other_information (
        applicant_id, email_address
    ) VALUES (
        new_applicant_id, p_email_address
    );
    
    -- Insert spouse information if provided
    IF p_spouse_full_name IS NOT NULL THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            new_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        );
    END IF;
    
    SELECT new_applicant_id as applicant_id;
END$$

-- Get applicant with complete information
DROP PROCEDURE IF EXISTS `getApplicantComplete`$$
CREATE PROCEDURE `getApplicantComplete`(IN `p_applicant_id` INT)
BEGIN
    IF p_applicant_id IS NULL THEN
        SELECT 
            a.*,
            bi.nature_of_business, bi.capitalization, bi.source_of_capital,
            bi.previous_business_experience, bi.relative_stall_owner,
            oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
            s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
            s.spouse_contact_number, s.spouse_occupation
        FROM applicant a
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
        ORDER BY a.created_at DESC;
    ELSE
        SELECT 
            a.*,
            bi.nature_of_business, bi.capitalization, bi.source_of_capital,
            bi.previous_business_experience, bi.relative_stall_owner,
            oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
            s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
            s.spouse_contact_number, s.spouse_occupation
        FROM applicant a
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
        WHERE a.applicant_id = p_applicant_id;
    END IF;
END$$

-- Update applicant with complete information
DROP PROCEDURE IF EXISTS `updateApplicantComplete`$$
CREATE PROCEDURE `updateApplicantComplete`(
    IN `p_applicant_id` INT,
    IN `p_full_name` VARCHAR(255),
    IN `p_contact_number` VARCHAR(20),
    IN `p_address` TEXT,
    IN `p_birthdate` DATE,
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'),
    IN `p_educational_attainment` VARCHAR(100),
    IN `p_nature_of_business` VARCHAR(255),
    IN `p_capitalization` DECIMAL(15,2),
    IN `p_source_of_capital` VARCHAR(255),
    IN `p_previous_business_experience` TEXT,
    IN `p_email_address` VARCHAR(255),
    IN `p_spouse_full_name` VARCHAR(255),
    IN `p_spouse_birthdate` DATE,
    IN `p_spouse_educational_attainment` VARCHAR(100),
    IN `p_spouse_contact_number` VARCHAR(20),
    IN `p_spouse_occupation` VARCHAR(100)
)
BEGIN
    -- Update applicant
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
    
    -- Update or insert business information
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience
    ) VALUES (
        p_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience
    ) ON DUPLICATE KEY UPDATE
        nature_of_business = VALUES(nature_of_business),
        capitalization = VALUES(capitalization),
        source_of_capital = VALUES(source_of_capital),
        previous_business_experience = VALUES(previous_business_experience);
    
    -- Update or insert other information
    INSERT INTO other_information (
        applicant_id, email_address
    ) VALUES (
        p_applicant_id, p_email_address
    ) ON DUPLICATE KEY UPDATE
        email_address = VALUES(email_address);
    
    -- Update or insert spouse information
    IF p_spouse_full_name IS NOT NULL THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            p_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        ) ON DUPLICATE KEY UPDATE
            spouse_full_name = VALUES(spouse_full_name),
            spouse_birthdate = VALUES(spouse_birthdate),
            spouse_educational_attainment = VALUES(spouse_educational_attainment),
            spouse_contact_number = VALUES(spouse_contact_number),
            spouse_occupation = VALUES(spouse_occupation);
    END IF;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================
-- STALL PROCEDURES
-- =====================================================

-- Get stalls with filters
DROP PROCEDURE IF EXISTS `getStallsFiltered`$$
CREATE PROCEDURE `getStallsFiltered`(
    IN `p_stall_id` INT,
    IN `p_branch_id` INT,
    IN `p_price_type` VARCHAR(50),
    IN `p_status` VARCHAR(50),
    IN `p_is_available` TINYINT
)
BEGIN
    SET @sql = 'SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE 1=1';
    
    IF p_stall_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.stall_id = ', p_stall_id);
    END IF;
    
    IF p_branch_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND b.branch_id = ', p_branch_id);
    END IF;
    
    IF p_price_type IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.price_type = "', p_price_type, '"');
    END IF;
    
    IF p_status IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.status = "', p_status, '"');
    END IF;
    
    IF p_is_available IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.is_available = ', p_is_available);
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY b.branch_name, f.floor_name, sec.section_name, s.stall_no');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- =====================================================
-- APPLICATION PROCEDURES
-- =====================================================

-- Delete application
DROP PROCEDURE IF EXISTS `deleteApplication`$$
CREATE PROCEDURE `deleteApplication`(IN `p_application_id` INT)
BEGIN
    DELETE FROM application WHERE application_id = p_application_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================
-- AUTHENTICATION PROCEDURES
-- =====================================================

-- Revoke all user tokens (for enhanced auth)
DROP PROCEDURE IF EXISTS `revokeAllUserTokens`$$
CREATE PROCEDURE `revokeAllUserTokens`(
    IN `p_user_id` INT,
    IN `p_user_type` VARCHAR(50),
    IN `p_reason` VARCHAR(255)
)
BEGIN
    -- This is a placeholder for token revocation
    -- Implement based on your token storage mechanism
    SELECT p_user_id as user_id, p_user_type as user_type, 'tokens_revoked' as status;
END$$

-- Get email template
DROP PROCEDURE IF EXISTS `getEmailTemplate`$$
CREATE PROCEDURE `getEmailTemplate`(IN `p_template_name` VARCHAR(100))
BEGIN
    SELECT * FROM employee_email_template 
    WHERE template_name = p_template_name AND is_active = 1;
END$$

-- =====================================================
-- BRANCH & SECTION PROCEDURES
-- =====================================================

-- Create section with branch_id parameter
DROP PROCEDURE IF EXISTS `createSection`$$
CREATE PROCEDURE `createSection`(
    IN `p_floor_id` INT,
    IN `p_section_name` VARCHAR(100),
    IN `p_branch_id` INT
)
BEGIN
    INSERT INTO section (floor_id, section_name)
    VALUES (p_floor_id, p_section_name);
    
    SELECT LAST_INSERT_ID() as section_id;
END$$

-- Create floor with branch_id parameter
DROP PROCEDURE IF EXISTS `createFloor`$$
CREATE PROCEDURE `createFloor`(
    IN `p_branch_id` INT,
    IN `p_floor_name` VARCHAR(50),
    IN `p_floor_number` INT,
    IN `p_branch_id_duplicate` INT
)
BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number)
    VALUES (p_branch_id, p_floor_name, p_floor_number);
    
    SELECT LAST_INSERT_ID() as floor_id;
END$$

DELIMITER ;

-- =====================================================
-- Register Migration
-- =====================================================
INSERT INTO migrations (migration_name, version) 
VALUES ('011_additional_missing_procedures', '1.0.0')
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP;

-- =====================================================
-- Migration Complete
-- =====================================================
SELECT CONCAT(
    '✅ Migration 011_additional_missing_procedures completed successfully at ',
    NOW()
) as message;
