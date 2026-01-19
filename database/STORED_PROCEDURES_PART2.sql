-- ========================================
-- NAGA STALL - STORED PROCEDURES (PART 2)
-- ========================================
-- Applicant, Stallholder, and Application Procedures
-- Data is encrypted in Node.js before being passed to these procedures
-- ========================================

USE naga_stall;

DELIMITER $$

-- ========================================
-- APPLICANT PROCEDURES (Landing Page)
-- ========================================

-- Register Mobile User (Applicant from landing page)
DROP PROCEDURE IF EXISTS registerMobileUser$$
CREATE PROCEDURE registerMobileUser(
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(500),
    IN p_password_hash VARCHAR(255),
    IN p_full_name VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_address TEXT,
    IN p_birthdate DATE,
    IN p_civil_status ENUM('Single','Married','Divorced','Widowed')
)
BEGIN
    DECLARE new_applicant_id INT;
    
    -- Insert applicant
    INSERT INTO applicant (
        applicant_username, applicant_email, applicant_password,
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, status
    ) VALUES (
        p_username, p_email, p_password_hash,
        p_full_name, p_contact_number, p_address,
        p_birthdate, IFNULL(p_civil_status, 'Single'), 'active'
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Create credential for mobile login
    INSERT INTO credential (applicant_id, username, password_hash)
    VALUES (new_applicant_id, p_username, p_password_hash);
    
    SELECT new_applicant_id AS applicant_id, 'Registration successful' AS message;
END$$

-- Create Applicant Complete (with all related data)
DROP PROCEDURE IF EXISTS createApplicantComplete$$
CREATE PROCEDURE createApplicantComplete(
    IN p_full_name VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_address TEXT,
    IN p_birthdate DATE,
    IN p_civil_status ENUM('Single','Married','Divorced','Widowed'),
    IN p_educational_attainment VARCHAR(100),
    IN p_nature_of_business VARCHAR(255),
    IN p_capitalization DECIMAL(15,2),
    IN p_source_of_capital VARCHAR(255),
    IN p_previous_business_experience TEXT,
    IN p_relative_stall_owner ENUM('Yes','No'),
    IN p_spouse_full_name VARCHAR(500),
    IN p_spouse_birthdate DATE,
    IN p_spouse_educational_attainment VARCHAR(100),
    IN p_spouse_contact_number VARCHAR(500),
    IN p_spouse_occupation VARCHAR(500),
    IN p_email_address VARCHAR(500)
)
BEGIN
    DECLARE new_applicant_id INT;
    
    -- Insert applicant
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment,
        applicant_email, status
    ) VALUES (
        p_full_name, p_contact_number, p_address,
        p_birthdate, IFNULL(p_civil_status, 'Single'), p_educational_attainment,
        p_email_address, 'active'
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Insert business information
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience, relative_stall_owner
    ) VALUES (
        new_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience, IFNULL(p_relative_stall_owner, 'No')
    );
    
    -- Insert other information
    INSERT INTO other_information (applicant_id, email_address)
    VALUES (new_applicant_id, p_email_address);
    
    -- Insert spouse if provided
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            new_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        );
    END IF;
    
    SELECT new_applicant_id AS applicant_id, 'Applicant created successfully' AS message;
END$$

-- Get All Applicants
DROP PROCEDURE IF EXISTS getAllApplicants$$
CREATE PROCEDURE getAllApplicants()
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_username,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        a.status,
        a.created_at
    FROM applicant a
    ORDER BY a.applicant_id DESC;
END$$

-- Get Applicant By ID
DROP PROCEDURE IF EXISTS getApplicantById$$
CREATE PROCEDURE getApplicantById(IN p_applicant_id INT)
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_username,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        a.status,
        a.created_at,
        bi.nature_of_business,
        bi.capitalization,
        bi.source_of_capital,
        bi.previous_business_experience,
        bi.relative_stall_owner,
        s.spouse_full_name,
        s.spouse_birthdate,
        s.spouse_educational_attainment,
        s.spouse_contact_number,
        s.spouse_occupation
    FROM applicant a
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
    WHERE a.applicant_id = p_applicant_id;
END$$

-- Get Applicant By Username (for mobile login)
DROP PROCEDURE IF EXISTS getApplicantByUsername$$
CREATE PROCEDURE getApplicantByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_username,
        a.applicant_password,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number,
        a.status
    FROM applicant a
    WHERE a.applicant_username = p_username AND a.status = 'active';
END$$

-- Get Mobile User By Username (via credential table)
DROP PROCEDURE IF EXISTS getMobileUserByUsername$$
CREATE PROCEDURE getMobileUserByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT 
        c.credential_id,
        c.applicant_id,
        c.username,
        c.password_hash,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number,
        a.status
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    WHERE c.username = p_username AND a.status = 'active';
END$$

-- Update Applicant
DROP PROCEDURE IF EXISTS updateApplicant$$
CREATE PROCEDURE updateApplicant(
    IN p_applicant_id INT,
    IN p_full_name VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_address TEXT,
    IN p_email VARCHAR(500)
)
BEGIN
    UPDATE applicant
    SET applicant_full_name = p_full_name,
        applicant_contact_number = p_contact_number,
        applicant_address = p_address,
        applicant_email = p_email,
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    SELECT p_applicant_id AS applicant_id, 'Applicant updated successfully' AS message;
END$$

-- ========================================
-- SPOUSE PROCEDURES
-- ========================================

-- Create Spouse
DROP PROCEDURE IF EXISTS createSpouse$$
CREATE PROCEDURE createSpouse(
    IN p_applicant_id INT,
    IN p_spouse_full_name VARCHAR(500),
    IN p_spouse_birthdate DATE,
    IN p_spouse_educational_attainment VARCHAR(100),
    IN p_spouse_contact_number VARCHAR(500),
    IN p_spouse_occupation VARCHAR(500)
)
BEGIN
    INSERT INTO spouse (
        applicant_id, spouse_full_name, spouse_birthdate,
        spouse_educational_attainment, spouse_contact_number, spouse_occupation
    ) VALUES (
        p_applicant_id, p_spouse_full_name, p_spouse_birthdate,
        p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
    );
    
    SELECT LAST_INSERT_ID() AS spouse_id, 'Spouse created successfully' AS message;
END$$

-- Get Spouse By Applicant ID
DROP PROCEDURE IF EXISTS getSpouseByApplicantId$$
CREATE PROCEDURE getSpouseByApplicantId(IN p_applicant_id INT)
BEGIN
    SELECT 
        spouse_id,
        applicant_id,
        spouse_full_name,
        spouse_birthdate,
        spouse_educational_attainment,
        spouse_contact_number,
        spouse_occupation
    FROM spouse
    WHERE applicant_id = p_applicant_id;
END$$

-- Get All Spouses
DROP PROCEDURE IF EXISTS getAllSpouses$$
CREATE PROCEDURE getAllSpouses()
BEGIN
    SELECT 
        s.spouse_id,
        s.applicant_id,
        s.spouse_full_name,
        s.spouse_birthdate,
        s.spouse_educational_attainment,
        s.spouse_contact_number,
        s.spouse_occupation,
        a.applicant_full_name
    FROM spouse s
    LEFT JOIN applicant a ON s.applicant_id = a.applicant_id
    ORDER BY s.spouse_id DESC;
END$$

-- ========================================
-- STALLHOLDER PROCEDURES
-- ========================================

-- Create Stallholder (when applicant is approved)
DROP PROCEDURE IF EXISTS createStallholder$$
CREATE PROCEDURE createStallholder(
    IN p_applicant_id INT,
    IN p_branch_id INT,
    IN p_stallholder_name VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_address TEXT,
    IN p_stall_id INT,
    IN p_monthly_rent DECIMAL(10,2),
    IN p_contract_start_date DATE,
    IN p_contract_end_date DATE
)
BEGIN
    DECLARE new_stallholder_id INT;
    
    INSERT INTO stallholder (
        applicant_id, branch_id, stallholder_name, contact_number,
        email, address, stall_id, monthly_rent,
        contract_start_date, contract_end_date, payment_status, status
    ) VALUES (
        p_applicant_id, p_branch_id, p_stallholder_name, p_contact_number,
        p_email, p_address, p_stall_id, IFNULL(p_monthly_rent, 0),
        IFNULL(p_contract_start_date, CURRENT_DATE), p_contract_end_date, 'unpaid', 'active'
    );
    
    SET new_stallholder_id = LAST_INSERT_ID();
    
    -- Update stall status to occupied
    IF p_stall_id IS NOT NULL THEN
        UPDATE stall 
        SET stallholder_id = new_stallholder_id, 
            status = 'Occupied', 
            is_available = 0,
            updated_at = NOW()
        WHERE stall_id = p_stall_id;
    END IF;
    
    -- Update applicant status to approved
    UPDATE applicant SET status = 'approved' WHERE applicant_id = p_applicant_id;
    
    SELECT new_stallholder_id AS stallholder_id, 'Stallholder created successfully' AS message;
END$$

-- Get All Stallholders
DROP PROCEDURE IF EXISTS getAllStallholders$$
CREATE PROCEDURE getAllStallholders()
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.applicant_id,
        sh.branch_id,
        b.branch_name,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.stall_id,
        st.stall_number,
        st.stall_name,
        sh.monthly_rent,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.payment_status,
        sh.last_payment_date,
        sh.status,
        sh.created_at
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    ORDER BY sh.stallholder_id DESC;
END$$

-- Get Stallholder By ID
DROP PROCEDURE IF EXISTS getStallholderById$$
CREATE PROCEDURE getStallholderById(IN p_stallholder_id INT)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.mobile_user_id,
        sh.branch_id,
        b.branch_name,
        sh.full_name as stallholder_name,
        bi.nature_of_business,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        s.rental_price as monthly_rent,
        sh.move_in_date as contract_start_date,
        sh.payment_status,
        sh.status,
        sh.created_at
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN business_information bi ON sh.mobile_user_id = bi.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id;
END$$

-- Get Stallholders By Branch
DROP PROCEDURE IF EXISTS getStallholdersByBranch$$
CREATE PROCEDURE getStallholdersByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.applicant_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.stall_id,
        st.stall_number,
        st.stall_name,
        sh.monthly_rent,
        sh.payment_status,
        sh.last_payment_date,
        sh.status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    WHERE sh.branch_id = p_branch_id AND sh.status = 'active'
    ORDER BY sh.stallholder_id DESC;
END$$

-- Update Stallholder
DROP PROCEDURE IF EXISTS updateStallholder$$
CREATE PROCEDURE updateStallholder(
    IN p_stallholder_id INT,
    IN p_stallholder_name VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_address TEXT
)
BEGIN
    UPDATE stallholder
    SET stallholder_name = p_stallholder_name,
        contact_number = p_contact_number,
        email = p_email,
        address = IFNULL(p_address, address),
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    SELECT p_stallholder_id AS stallholder_id, 'Stallholder updated successfully' AS message;
END$$

-- ========================================
-- APPLICATION PROCEDURES
-- ========================================

-- Create Application
DROP PROCEDURE IF EXISTS createApplication$$
CREATE PROCEDURE createApplication(
    IN p_applicant_id INT,
    IN p_stall_id INT,
    IN p_application_date DATE
)
BEGIN
    DECLARE new_application_id INT;
    
    INSERT INTO application (
        applicant_id, stall_id, application_date, application_status
    ) VALUES (
        p_applicant_id, p_stall_id, IFNULL(p_application_date, CURRENT_DATE), 'Pending'
    );
    
    SET new_application_id = LAST_INSERT_ID();
    
    SELECT new_application_id AS application_id, 'Application submitted successfully' AS message;
END$$

-- Get All Applications
DROP PROCEDURE IF EXISTS getAllApplications$$
CREATE PROCEDURE getAllApplications()
BEGIN
    SELECT 
        app.application_id,
        app.applicant_id,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number,
        app.stall_id,
        st.stall_number,
        st.stall_name,
        b.branch_id,
        b.branch_name,
        app.application_date,
        app.application_status,
        app.reviewed_by,
        app.reviewed_at,
        app.remarks,
        app.created_at
    FROM application app
    INNER JOIN applicant a ON app.applicant_id = a.applicant_id
    INNER JOIN stall st ON app.stall_id = st.stall_id
    INNER JOIN branch b ON st.branch_id = b.branch_id
    ORDER BY app.application_id DESC;
END$$

-- Get Applications By Applicant
DROP PROCEDURE IF EXISTS getApplicationsByApplicant$$
CREATE PROCEDURE getApplicationsByApplicant(IN p_applicant_id INT)
BEGIN
    SELECT 
        app.application_id,
        app.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        st.monthly_rent,
        b.branch_id,
        b.branch_name,
        app.application_date,
        app.application_status,
        app.remarks
    FROM application app
    INNER JOIN stall st ON app.stall_id = st.stall_id
    INNER JOIN branch b ON st.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC;
END$$

-- Approve Application
DROP PROCEDURE IF EXISTS approveApplication$$
CREATE PROCEDURE approveApplication(
    IN p_application_id INT,
    IN p_reviewed_by INT,
    IN p_remarks TEXT
)
BEGIN
    DECLARE v_applicant_id INT;
    DECLARE v_stall_id INT;
    
    -- Get application details
    SELECT applicant_id, stall_id INTO v_applicant_id, v_stall_id
    FROM application WHERE application_id = p_application_id;
    
    -- Update application status
    UPDATE application
    SET application_status = 'Approved',
        reviewed_by = p_reviewed_by,
        reviewed_at = NOW(),
        remarks = p_remarks,
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    -- Mark stall as reserved
    UPDATE stall
    SET status = 'Reserved', is_available = 0, updated_at = NOW()
    WHERE stall_id = v_stall_id;
    
    SELECT p_application_id AS application_id, v_applicant_id AS applicant_id, 
           v_stall_id AS stall_id, 'Application approved successfully' AS message;
END$$

-- Reject Application
DROP PROCEDURE IF EXISTS rejectApplication$$
CREATE PROCEDURE rejectApplication(
    IN p_application_id INT,
    IN p_reviewed_by INT,
    IN p_remarks TEXT
)
BEGIN
    UPDATE application
    SET application_status = 'Rejected',
        reviewed_by = p_reviewed_by,
        reviewed_at = NOW(),
        remarks = p_remarks,
        updated_at = NOW()
    WHERE application_id = p_application_id;
    
    SELECT p_application_id AS application_id, 'Application rejected' AS message;
END$$

DELIMITER ;
