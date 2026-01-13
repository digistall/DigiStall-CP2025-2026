-- Migration: 404_vendor_relations_procedures.sql
-- Description: Stored procedures for vendor with related tables
-- Date: 2026-01-10
-- Dependencies: vendor, vendor_spouse, vendor_child, vendor_business, assigned_location tables
-- Author: System Administrator

-- ========================================
-- DROP EXISTING PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS `createVendorWithRelations`;
DROP PROCEDURE IF EXISTS `updateVendorWithRelations`;
DROP PROCEDURE IF EXISTS `getVendorWithRelations`;
DROP PROCEDURE IF EXISTS `getAllVendorsWithRelations`;
DROP PROCEDURE IF EXISTS `deleteVendorWithRelations`;

DELIMITER $$

-- ========================================
-- CREATE VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `createVendorWithRelations`(
    -- Vendor personal info
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_suffix VARCHAR(10),
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_vendor_identifier VARCHAR(45),
    IN p_status VARCHAR(20),
    
    -- Spouse info
    IN p_spouse_full_name VARCHAR(100),
    IN p_spouse_age INT,
    IN p_spouse_birthdate DATE,
    IN p_spouse_education VARCHAR(100),
    IN p_spouse_contact VARCHAR(20),
    IN p_spouse_occupation VARCHAR(45),
    
    -- Child info
    IN p_child_full_name VARCHAR(45),
    IN p_child_age INT,
    IN p_child_birthdate DATE,
    
    -- Business info
    IN p_business_name VARCHAR(45),
    IN p_business_type VARCHAR(45),
    IN p_business_description VARCHAR(255),
    IN p_vending_start VARCHAR(45),
    IN p_vending_end VARCHAR(45),
    
    -- Location info
    IN p_location_name VARCHAR(45)
)
BEGIN
    DECLARE v_spouse_id INT DEFAULT NULL;
    DECLARE v_child_id INT DEFAULT NULL;
    DECLARE v_business_id INT DEFAULT NULL;
    DECLARE v_location_id INT DEFAULT NULL;
    DECLARE v_vendor_id INT;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Insert spouse if data provided
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO vendor_spouse (
            full_name, age, birthdate, educational_attainment,
            contact_number, occupation
        ) VALUES (
            p_spouse_full_name, p_spouse_age, p_spouse_birthdate,
            p_spouse_education, p_spouse_contact, p_spouse_occupation
        );
        SET v_spouse_id = LAST_INSERT_ID();
    END IF;
    
    -- Insert child if data provided
    IF p_child_full_name IS NOT NULL AND p_child_full_name != '' THEN
        INSERT INTO vendor_child (
            full_name, age, birthdate
        ) VALUES (
            p_child_full_name, p_child_age, p_child_birthdate
        );
        SET v_child_id = LAST_INSERT_ID();
    END IF;
    
    -- Insert business if data provided
    IF p_business_name IS NOT NULL AND p_business_name != '' THEN
        INSERT INTO vendor_business (
            business_name, business_type, business_description,
            vending_time_start, vending_time_end
        ) VALUES (
            p_business_name, p_business_type, p_business_description,
            p_vending_start, p_vending_end
        );
        SET v_business_id = LAST_INSERT_ID();
    END IF;
    
    -- Insert or find location
    IF p_location_name IS NOT NULL AND p_location_name != '' THEN
        -- Check if location exists
        SELECT assigned_location_id INTO v_location_id
        FROM assigned_location
        WHERE location_name = p_location_name
        LIMIT 1;
        
        -- Create if doesn't exist
        IF v_location_id IS NULL THEN
            INSERT INTO assigned_location (location_name)
            VALUES (p_location_name);
            SET v_location_id = LAST_INSERT_ID();
        END IF;
    END IF;
    
    -- Insert vendor
    INSERT INTO vendor (
        first_name, last_name, middle_name, suffix,
        contact_number, email, birthdate, gender, address,
        vendor_identifier, status,
        vendor_spouse_id, vendor_child_id, vendor_business_id,
        assigned_location_id
    ) VALUES (
        p_first_name, p_last_name, p_middle_name, p_suffix,
        p_contact_number, p_email, p_birthdate, p_gender, p_address,
        p_vendor_identifier, COALESCE(p_status, 'Active'),
        v_spouse_id, v_child_id, v_business_id, v_location_id
    );
    
    SET v_vendor_id = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Return vendor ID
    SELECT v_vendor_id AS vendor_id;
END$$

-- ========================================
-- UPDATE VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `updateVendorWithRelations`(
    IN p_vendor_id INT,
    -- Vendor personal info
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_suffix VARCHAR(10),
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_vendor_identifier VARCHAR(45),
    IN p_status VARCHAR(20),
    
    -- Spouse info
    IN p_spouse_full_name VARCHAR(100),
    IN p_spouse_age INT,
    IN p_spouse_birthdate DATE,
    IN p_spouse_education VARCHAR(100),
    IN p_spouse_contact VARCHAR(20),
    IN p_spouse_occupation VARCHAR(45),
    
    -- Child info
    IN p_child_full_name VARCHAR(45),
    IN p_child_age INT,
    IN p_child_birthdate DATE,
    
    -- Business info
    IN p_business_name VARCHAR(45),
    IN p_business_type VARCHAR(45),
    IN p_business_description VARCHAR(255),
    IN p_vending_start VARCHAR(45),
    IN p_vending_end VARCHAR(45),
    
    -- Location info
    IN p_location_name VARCHAR(45)
)
BEGIN
    DECLARE v_spouse_id INT DEFAULT NULL;
    DECLARE v_child_id INT DEFAULT NULL;
    DECLARE v_business_id INT DEFAULT NULL;
    DECLARE v_location_id INT DEFAULT NULL;
    
    START TRANSACTION;
    
    -- Get existing foreign keys
    SELECT vendor_spouse_id, vendor_child_id, vendor_business_id, assigned_location_id
    INTO v_spouse_id, v_child_id, v_business_id, v_location_id
    FROM vendor
    WHERE vendor_id = p_vendor_id;
    
    -- Update or create spouse
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        IF v_spouse_id IS NOT NULL THEN
            -- Update existing
            UPDATE vendor_spouse SET
                full_name = p_spouse_full_name,
                age = p_spouse_age,
                birthdate = p_spouse_birthdate,
                educational_attainment = p_spouse_education,
                contact_number = p_spouse_contact,
                occupation = p_spouse_occupation
            WHERE vendor_spouse_id = v_spouse_id;
        ELSE
            -- Create new
            INSERT INTO vendor_spouse (
                full_name, age, birthdate, educational_attainment,
                contact_number, occupation
            ) VALUES (
                p_spouse_full_name, p_spouse_age, p_spouse_birthdate,
                p_spouse_education, p_spouse_contact, p_spouse_occupation
            );
            SET v_spouse_id = LAST_INSERT_ID();
        END IF;
    END IF;
    
    -- Update or create child
    IF p_child_full_name IS NOT NULL AND p_child_full_name != '' THEN
        IF v_child_id IS NOT NULL THEN
            -- Update existing
            UPDATE vendor_child SET
                full_name = p_child_full_name,
                age = p_child_age,
                birthdate = p_child_birthdate
            WHERE vendor_child_id = v_child_id;
        ELSE
            -- Create new
            INSERT INTO vendor_child (
                full_name, age, birthdate
            ) VALUES (
                p_child_full_name, p_child_age, p_child_birthdate
            );
            SET v_child_id = LAST_INSERT_ID();
        END IF;
    END IF;
    
    -- Update or create business
    IF p_business_name IS NOT NULL AND p_business_name != '' THEN
        IF v_business_id IS NOT NULL THEN
            -- Update existing
            UPDATE vendor_business SET
                business_name = p_business_name,
                business_type = p_business_type,
                business_description = p_business_description,
                vending_time_start = p_vending_start,
                vending_time_end = p_vending_end
            WHERE vendor_business_id = v_business_id;
        ELSE
            -- Create new
            INSERT INTO vendor_business (
                business_name, business_type, business_description,
                vending_time_start, vending_time_end
            ) VALUES (
                p_business_name, p_business_type, p_business_description,
                p_vending_start, p_vending_end
            );
            SET v_business_id = LAST_INSERT_ID();
        END IF;
    END IF;
    
    -- Update or create location
    IF p_location_name IS NOT NULL AND p_location_name != '' THEN
        -- Check if location exists
        SELECT assigned_location_id INTO v_location_id
        FROM assigned_location
        WHERE location_name = p_location_name
        LIMIT 1;
        
        -- Create if doesn't exist
        IF v_location_id IS NULL THEN
            INSERT INTO assigned_location (location_name)
            VALUES (p_location_name);
            SET v_location_id = LAST_INSERT_ID();
        END IF;
    END IF;
    
    -- Update vendor
    UPDATE vendor SET
        first_name = p_first_name,
        last_name = p_last_name,
        middle_name = p_middle_name,
        suffix = p_suffix,
        contact_number = p_contact_number,
        email = p_email,
        birthdate = p_birthdate,
        gender = p_gender,
        address = p_address,
        vendor_identifier = p_vendor_identifier,
        status = p_status,
        vendor_spouse_id = v_spouse_id,
        vendor_child_id = v_child_id,
        vendor_business_id = v_business_id,
        assigned_location_id = v_location_id
    WHERE vendor_id = p_vendor_id;
    
    COMMIT;
END$$

-- ========================================
-- GET VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `getVendorWithRelations`(
    IN p_vendor_id INT
)
BEGIN
    SELECT 
        v.vendor_id,
        v.first_name,
        v.last_name,
        v.middle_name,
        v.suffix,
        v.contact_number,
        v.email,
        v.birthdate,
        v.gender,
        v.address,
        v.vendor_identifier,
        v.status,
        v.created_at,
        v.updated_at,
        -- Spouse
        vs.vendor_spouse_id,
        vs.full_name AS spouse_full_name,
        vs.age AS spouse_age,
        vs.birthdate AS spouse_birthdate,
        vs.educational_attainment AS spouse_education,
        vs.contact_number AS spouse_contact,
        vs.occupation AS spouse_occupation,
        -- Child
        vc.vendor_child_id,
        vc.full_name AS child_full_name,
        vc.age AS child_age,
        vc.birthdate AS child_birthdate,
        -- Business
        vb.vendor_business_id,
        vb.business_name,
        vb.business_type,
        vb.business_description,
        vb.vending_time_start,
        vb.vending_time_end,
        -- Location
        al.assigned_location_id,
        al.location_name
    FROM vendor v
    LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
    LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    WHERE v.vendor_id = p_vendor_id;
END$$

-- ========================================
-- GET ALL VENDORS WITH RELATIONS
-- ========================================

CREATE PROCEDURE `getAllVendorsWithRelations`()
BEGIN
    SELECT 
        v.vendor_id,
        v.first_name,
        v.last_name,
        v.middle_name,
        v.suffix,
        v.contact_number,
        v.email,
        v.status,
        vb.business_name,
        al.location_name,
        v.created_at,
        v.updated_at
    FROM vendor v
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    ORDER BY v.created_at DESC;
END$$

-- ========================================
-- DELETE VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `deleteVendorWithRelations`(
    IN p_vendor_id INT,
    IN p_delete_relations BOOLEAN
)
BEGIN
    DECLARE v_spouse_id INT;
    DECLARE v_child_id INT;
    DECLARE v_business_id INT;
    
    START TRANSACTION;
    
    IF p_delete_relations THEN
        -- Get foreign keys
        SELECT vendor_spouse_id, vendor_child_id, vendor_business_id
        INTO v_spouse_id, v_child_id, v_business_id
        FROM vendor
        WHERE vendor_id = p_vendor_id;
        
        -- Delete related records
        IF v_spouse_id IS NOT NULL THEN
            DELETE FROM vendor_spouse WHERE vendor_spouse_id = v_spouse_id;
        END IF;
        
        IF v_child_id IS NOT NULL THEN
            DELETE FROM vendor_child WHERE vendor_child_id = v_child_id;
        END IF;
        
        IF v_business_id IS NOT NULL THEN
            DELETE FROM vendor_business WHERE vendor_business_id = v_business_id;
        END IF;
    END IF;
    
    -- Soft delete vendor (set status to Inactive)
    UPDATE vendor SET status = 'Inactive' WHERE vendor_id = p_vendor_id;
    
    COMMIT;
END$$

DELIMITER ;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Uncomment to verify procedures were created successfully
-- SHOW PROCEDURE STATUS WHERE Db = DATABASE() AND Name LIKE '%Vendor%';
