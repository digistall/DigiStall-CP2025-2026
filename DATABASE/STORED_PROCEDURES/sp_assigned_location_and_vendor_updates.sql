-- Procedures to support searchable assigned locations and vendor creation/update by ID
-- with comprehensive error handling and validation

DROP PROCEDURE IF EXISTS `getAssignedLocations`;
DELIMITER $$
CREATE PROCEDURE `getAssignedLocations`(
    IN p_search VARCHAR(100)
)
BEGIN
    SELECT
        assigned_location_id AS id,
        location_name AS name
    FROM assigned_location
    WHERE p_search IS NULL
       OR location_name LIKE CONCAT('%', p_search, '%')
    ORDER BY location_name ASC;
END$$
DELIMITER ;

-- Modified vendor procedures to optionally take an existing location ID
DROP PROCEDURE IF EXISTS `createVendorWithRelations`;
DELIMITER $$
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

    -- Location info (either ID or name)
    IN p_assigned_location_id INT,
    IN p_location_name VARCHAR(45)
)
BEGIN
    DECLARE v_spouse_id INT DEFAULT NULL;
    DECLARE v_child_id INT DEFAULT NULL;
    DECLARE v_business_id INT DEFAULT NULL;
    DECLARE v_location_id INT DEFAULT NULL;
    DECLARE v_vendor_id INT;
    DECLARE v_email_count INT;

    -- Start transaction
    START TRANSACTION;

    -- Validate required fields
    IF p_first_name IS NULL OR p_first_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'First name is required';
    END IF;

    IF p_last_name IS NULL OR p_last_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Last name is required';
    END IF;

    -- Check for duplicate email
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT COUNT(*) INTO v_email_count FROM vendor WHERE email = p_email;
        IF v_email_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor with this email already exists';
        END IF;
    END IF;

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

    -- Determine location id
    IF p_assigned_location_id IS NOT NULL THEN
        -- Verify location exists
        SELECT assigned_location_id INTO v_location_id FROM assigned_location WHERE assigned_location_id = p_assigned_location_id LIMIT 1;
        IF v_location_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Specified location does not exist';
        END IF;
    ELSEIF p_location_name IS NOT NULL AND p_location_name != '' THEN
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

    IF v_vendor_id IS NULL OR v_vendor_id = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to generate vendor ID';
    END IF;

    COMMIT;

    -- Return vendor ID and status
    SELECT 
        v_vendor_id AS vendor_id,
        'success' AS status,
        'Vendor created successfully' AS message;
END$$
DELIMITER ;

-- Similarly updateVendorWithRelations with error handling
DROP PROCEDURE IF EXISTS `updateVendorWithRelations`;
DELIMITER $$
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

    -- Location info (either ID or name)
    IN p_assigned_location_id INT,
    IN p_location_name VARCHAR(45)
)
BEGIN
    DECLARE v_spouse_id INT;
    DECLARE v_child_id INT;
    DECLARE v_business_id INT;
    DECLARE v_location_id INT;
    DECLARE v_vendor_exists INT;
    DECLARE v_email_count INT;

    START TRANSACTION;

    -- Validate vendor exists
    SELECT COUNT(*) INTO v_vendor_exists FROM vendor WHERE vendor_id = p_vendor_id;
    IF v_vendor_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor not found';
    END IF;

    -- Validate required fields
    IF p_first_name IS NULL OR p_first_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'First name is required';
    END IF;

    IF p_last_name IS NULL OR p_last_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Last name is required';
    END IF;

    -- Check for duplicate email (excluding self)
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT COUNT(*) INTO v_email_count FROM vendor WHERE email = p_email AND vendor_id != p_vendor_id;
        IF v_email_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor with this email already exists';
        END IF;
    END IF;

    -- Get existing foreign keys
    SELECT vendor_spouse_id, vendor_child_id, vendor_business_id, assigned_location_id
    INTO v_spouse_id, v_child_id, v_business_id, v_location_id
    FROM vendor
    WHERE vendor_id = p_vendor_id;

    -- Update or create spouse
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        IF v_spouse_id IS NULL THEN
            INSERT INTO vendor_spouse (
                full_name, age, birthdate, educational_attainment,
                contact_number, occupation
            ) VALUES (
                p_spouse_full_name, p_spouse_age, p_spouse_birthdate,
                p_spouse_education, p_spouse_contact, p_spouse_occupation
            );
            SET v_spouse_id = LAST_INSERT_ID();
        ELSE
            UPDATE vendor_spouse
            SET full_name = p_spouse_full_name,
                age = p_spouse_age,
                birthdate = p_spouse_birthdate,
                educational_attainment = p_spouse_education,
                contact_number = p_spouse_contact,
                occupation = p_spouse_occupation,
                updated_at = NOW()
            WHERE vendor_spouse_id = v_spouse_id;
        END IF;
    END IF;

    -- Update or create child
    IF p_child_full_name IS NOT NULL AND p_child_full_name != '' THEN
        IF v_child_id IS NULL THEN
            INSERT INTO vendor_child (
                full_name, age, birthdate
            ) VALUES (
                p_child_full_name, p_child_age, p_child_birthdate
            );
            SET v_child_id = LAST_INSERT_ID();
        ELSE
            UPDATE vendor_child
            SET full_name = p_child_full_name,
                age = p_child_age,
                birthdate = p_child_birthdate,
                updated_at = NOW()
            WHERE vendor_child_id = v_child_id;
        END IF;
    END IF;

    -- Update or create business
    IF p_business_name IS NOT NULL AND p_business_name != '' THEN
        IF v_business_id IS NULL THEN
            INSERT INTO vendor_business (
                business_name, business_type, business_description,
                vending_time_start, vending_time_end
            ) VALUES (
                p_business_name, p_business_type, p_business_description,
                p_vending_start, p_vending_end
            );
            SET v_business_id = LAST_INSERT_ID();
        ELSE
            UPDATE vendor_business
            SET business_name = p_business_name,
                business_type = p_business_type,
                business_description = p_business_description,
                vending_time_start = p_vending_start,
                vending_time_end = p_vending_end,
                updated_at = NOW()
            WHERE vendor_business_id = v_business_id;
        END IF;
    END IF;

    -- Determine location id
    IF p_assigned_location_id IS NOT NULL THEN
        -- Verify location exists
        SELECT assigned_location_id INTO v_location_id FROM assigned_location WHERE assigned_location_id = p_assigned_location_id LIMIT 1;
        IF v_location_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Specified location does not exist';
        END IF;
    ELSEIF p_location_name IS NOT NULL AND p_location_name != '' THEN
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
    UPDATE vendor
    SET first_name = p_first_name,
        last_name = p_last_name,
        middle_name = p_middle_name,
        suffix = p_suffix,
        contact_number = p_contact_number,
        email = p_email,
        birthdate = p_birthdate,
        gender = p_gender,
        address = p_address,
        vendor_identifier = p_vendor_identifier,
        status = COALESCE(p_status, 'Active'),
        vendor_spouse_id = v_spouse_id,
        vendor_child_id = v_child_id,
        vendor_business_id = v_business_id,
        assigned_location_id = v_location_id,
        updated_at = NOW()
    WHERE vendor_id = p_vendor_id;

    COMMIT;

    -- Return status
    SELECT 
        p_vendor_id AS vendor_id,
        'success' AS status,
        'Vendor updated successfully' AS message;
END$$
DELIMITER ;

