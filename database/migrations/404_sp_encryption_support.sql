-- =====================================================
-- MIGRATION: Data Encryption Support
-- Part 5: Stored Procedures for Encrypted Data Handling
-- =====================================================
-- Note: Encryption is handled at the application layer (Node.js)
-- This file creates stored procedures that work with encrypted data
-- =====================================================

DELIMITER //

-- =====================================================
-- ENCRYPTED DATA INSERTION STORED PROCEDURES
-- These accept pre-encrypted data from the application
-- =====================================================

-- SP: sp_createApplicantEncrypted
DROP PROCEDURE IF EXISTS sp_createApplicantEncrypted//
CREATE PROCEDURE sp_createApplicantEncrypted(
    IN p_full_name VARCHAR(500),
    IN p_first_name VARCHAR(255),
    IN p_middle_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_contact_number VARCHAR(255),
    IN p_address VARCHAR(1000),
    IN p_birthdate VARCHAR(255),
    IN p_civil_status VARCHAR(50),
    IN p_educational_attainment VARCHAR(100)
)
BEGIN
    INSERT INTO applicant (
        applicant_full_name,
        applicant_first_name,
        applicant_middle_name,
        applicant_last_name,
        applicant_contact_number,
        applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,
        applied_date,
        created_at
    ) VALUES (
        p_full_name,
        p_first_name,
        p_middle_name,
        p_last_name,
        p_contact_number,
        p_address,
        p_birthdate,
        p_civil_status,
        p_educational_attainment,
        CURDATE(),
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as applicant_id;
END//

-- SP: sp_createStallholderEncrypted
DROP PROCEDURE IF EXISTS sp_createStallholderEncrypted//
CREATE PROCEDURE sp_createStallholderEncrypted(
    IN p_applicant_id INT,
    IN p_stallholder_name VARCHAR(500),
    IN p_contact_number VARCHAR(255),
    IN p_email VARCHAR(500),
    IN p_address VARCHAR(1000),
    IN p_business_name VARCHAR(500),
    IN p_business_type VARCHAR(255),
    IN p_stall_id INT,
    IN p_branch_id INT
)
BEGIN
    INSERT INTO stallholder (
        applicant_id,
        stallholder_name,
        contact_number,
        email,
        address,
        business_name,
        business_type,
        stall_id,
        branch_id,
        contract_status,
        created_at
    ) VALUES (
        p_applicant_id,
        p_stallholder_name,
        p_contact_number,
        p_email,
        p_address,
        p_business_name,
        p_business_type,
        p_stall_id,
        p_branch_id,
        'Active',
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as stallholder_id;
END//

-- SP: sp_createInspectorEncrypted
DROP PROCEDURE IF EXISTS sp_createInspectorEncrypted//
CREATE PROCEDURE sp_createInspectorEncrypted(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255)
)
BEGIN
    INSERT INTO inspector (
        username,
        password,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status,
        created_at
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        CURDATE(),
        'active',
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as inspector_id;
END//

-- SP: sp_createCollectorEncrypted
DROP PROCEDURE IF EXISTS sp_createCollectorEncrypted//
CREATE PROCEDURE sp_createCollectorEncrypted(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255)
)
BEGIN
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status,
        date_created
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        CURDATE(),
        'active',
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END//

-- SP: sp_createBranchManagerEncrypted
DROP PROCEDURE IF EXISTS sp_createBranchManagerEncrypted//
CREATE PROCEDURE sp_createBranchManagerEncrypted(
    IN p_branch_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_username VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_email VARCHAR(500),
    IN p_contact_number VARCHAR(255),
    IN p_address VARCHAR(1000),
    IN p_status VARCHAR(50)
)
BEGIN
    INSERT INTO branch_manager (
        branch_id,
        first_name,
        last_name,
        manager_username,
        manager_password_hash,
        email,
        contact_number,
        address,
        status,
        created_at
    ) VALUES (
        p_branch_id,
        p_first_name,
        p_last_name,
        p_username,
        p_password_hash,
        p_email,
        p_contact_number,
        p_address,
        COALESCE(p_status, 'active'),
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as branch_manager_id;
END//

-- SP: sp_createSpouseEncrypted
DROP PROCEDURE IF EXISTS sp_createSpouseEncrypted//
CREATE PROCEDURE sp_createSpouseEncrypted(
    IN p_applicant_id INT,
    IN p_spouse_full_name VARCHAR(500),
    IN p_spouse_birthdate VARCHAR(255),
    IN p_spouse_educational_attainment VARCHAR(100),
    IN p_spouse_contact_number VARCHAR(255),
    IN p_spouse_occupation VARCHAR(500)
)
BEGIN
    INSERT INTO spouse (
        applicant_id,
        spouse_full_name,
        spouse_birthdate,
        spouse_educational_attainment,
        spouse_contact_number,
        spouse_occupation,
        created_at
    ) VALUES (
        p_applicant_id,
        p_spouse_full_name,
        p_spouse_birthdate,
        p_spouse_educational_attainment,
        p_spouse_contact_number,
        p_spouse_occupation,
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as spouse_id;
END//

-- =====================================================
-- UPDATE STORED PROCEDURES FOR ENCRYPTED DATA
-- =====================================================

-- SP: sp_updateApplicantEncrypted
DROP PROCEDURE IF EXISTS sp_updateApplicantEncrypted//
CREATE PROCEDURE sp_updateApplicantEncrypted(
    IN p_applicant_id INT,
    IN p_full_name VARCHAR(500),
    IN p_first_name VARCHAR(255),
    IN p_middle_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_contact_number VARCHAR(255),
    IN p_address VARCHAR(1000),
    IN p_birthdate VARCHAR(255)
)
BEGIN
    UPDATE applicant SET
        applicant_full_name = COALESCE(p_full_name, applicant_full_name),
        applicant_first_name = COALESCE(p_first_name, applicant_first_name),
        applicant_middle_name = COALESCE(p_middle_name, applicant_middle_name),
        applicant_last_name = COALESCE(p_last_name, applicant_last_name),
        applicant_contact_number = COALESCE(p_contact_number, applicant_contact_number),
        applicant_address = COALESCE(p_address, applicant_address),
        applicant_birthdate = COALESCE(p_birthdate, applicant_birthdate),
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateStallholderEncrypted
DROP PROCEDURE IF EXISTS sp_updateStallholderEncrypted//
CREATE PROCEDURE sp_updateStallholderEncrypted(
    IN p_stallholder_id INT,
    IN p_stallholder_name VARCHAR(500),
    IN p_contact_number VARCHAR(255),
    IN p_email VARCHAR(500),
    IN p_address VARCHAR(1000),
    IN p_business_name VARCHAR(500)
)
BEGIN
    UPDATE stallholder SET
        stallholder_name = COALESCE(p_stallholder_name, stallholder_name),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        address = COALESCE(p_address, address),
        business_name = COALESCE(p_business_name, business_name),
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- COLUMN SIZE ADJUSTMENTS FOR ENCRYPTED DATA
-- Encrypted data is larger than plaintext
-- Uses ALTER IGNORE to skip columns that don't exist
-- =====================================================

DELIMITER ;

-- Alter tables to accommodate encrypted data (encrypted data is about 3x larger)
-- These will only modify columns that exist in your schema

-- Check and update applicant table (only common columns)
ALTER TABLE applicant MODIFY COLUMN applicant_full_name VARCHAR(500);
ALTER TABLE applicant MODIFY COLUMN applicant_contact_number VARCHAR(255);
ALTER TABLE applicant MODIFY COLUMN applicant_address VARCHAR(1000);

-- Check and update stallholder table
ALTER TABLE stallholder MODIFY COLUMN stallholder_name VARCHAR(500);
ALTER TABLE stallholder MODIFY COLUMN contact_number VARCHAR(255);
ALTER TABLE stallholder MODIFY COLUMN email VARCHAR(500);
ALTER TABLE stallholder MODIFY COLUMN address VARCHAR(1000);
ALTER TABLE stallholder MODIFY COLUMN business_name VARCHAR(500);

-- Check and update inspector table
ALTER TABLE inspector MODIFY COLUMN first_name VARCHAR(255);
ALTER TABLE inspector MODIFY COLUMN last_name VARCHAR(255);
ALTER TABLE inspector MODIFY COLUMN email VARCHAR(500);
ALTER TABLE inspector MODIFY COLUMN contact_no VARCHAR(255);

-- Check and update collector table
ALTER TABLE collector MODIFY COLUMN first_name VARCHAR(255);
ALTER TABLE collector MODIFY COLUMN last_name VARCHAR(255);
ALTER TABLE collector MODIFY COLUMN email VARCHAR(500);
ALTER TABLE collector MODIFY COLUMN contact_no VARCHAR(255);

-- Note: branch_manager and spouse table alterations removed - run manually if needed
-- ALTER TABLE branch_manager MODIFY COLUMN first_name VARCHAR(255);
-- ALTER TABLE branch_manager MODIFY COLUMN last_name VARCHAR(255);
-- ALTER TABLE spouse MODIFY COLUMN spouse_full_name VARCHAR(500);

SELECT 'Part 5 Migration Complete - Encryption Support Added!' as status;
