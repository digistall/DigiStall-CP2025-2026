-- Migration: Add profile extension fields and Create sp_updateUserProfile
-- Created: 2026-03-10

-- 1. Add columns to system_administrator
ALTER TABLE system_administrator 
ADD COLUMN bio TEXT NULL,
ADD COLUMN date_of_birth DATE NULL,
ADD COLUMN gender VARCHAR(20) NULL;

-- 2. Add columns to stall_business_owner
ALTER TABLE stall_business_owner
ADD COLUMN bio TEXT NULL,
ADD COLUMN date_of_birth DATE NULL,
ADD COLUMN gender VARCHAR(20) NULL,
ADD COLUMN address TEXT NULL;

-- 3. Add columns to business_manager
ALTER TABLE business_manager
ADD COLUMN bio TEXT NULL,
ADD COLUMN date_of_birth DATE NULL,
ADD COLUMN gender VARCHAR(20) NULL;

-- 4. Add columns to business_employee
ALTER TABLE business_employee
ADD COLUMN bio TEXT NULL,
ADD COLUMN date_of_birth DATE NULL,
ADD COLUMN gender VARCHAR(20) NULL,
ADD COLUMN address TEXT NULL;

-- 5. Create Unified Stored Procedure for Profile Updates
DELIMITER //

CREATE PROCEDURE sp_updateUserProfile(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_first_name TEXT,
    IN p_last_name TEXT,
    IN p_phone TEXT,
    IN p_address TEXT,
    IN p_bio TEXT,
    IN p_dob DATE,
    IN p_gender VARCHAR(20),
    IN p_updated_at DATETIME
)
BEGIN
    IF p_user_type = 'system_administrator' THEN
        UPDATE system_administrator 
        SET first_name = p_first_name, 
            last_name = p_last_name, 
            contact_number = p_phone,
            bio = p_bio,
            date_of_birth = p_dob,
            gender = p_gender,
            updated_at = p_updated_at
        WHERE system_admin_id = p_user_id;
        
    ELSEIF p_user_type = 'stall_business_owner' THEN
        UPDATE stall_business_owner 
        SET first_name = p_first_name, 
            last_name = p_last_name, 
            contact_number = p_phone,
            address = p_address,
            bio = p_bio,
            date_of_birth = p_dob,
            gender = p_gender,
            updated_at = p_updated_at
        WHERE business_owner_id = p_user_id;
        
    ELSEIF p_user_type = 'business_manager' THEN
        UPDATE business_manager 
        SET first_name = p_first_name, 
            last_name = p_last_name, 
            contact_number = p_phone,
            address = p_address,
            bio = p_bio,
            date_of_birth = p_dob,
            gender = p_gender,
            updated_at = p_updated_at
        WHERE business_manager_id = p_user_id;
        
    ELSEIF p_user_type = 'business_employee' THEN
        UPDATE business_employee 
        SET first_name = p_first_name, 
            last_name = p_last_name, 
            phone_number = p_phone,
            address = p_address,
            bio = p_bio,
            date_of_birth = p_dob,
            gender = p_gender,
            updated_at = p_updated_at
        WHERE business_employee_id = p_user_id;
    END IF;
END //

DELIMITER ;
