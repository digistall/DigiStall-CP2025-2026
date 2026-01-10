-- =====================================================
-- MIGRATION: Convert All Raw SQL to Stored Procedures
-- Part 4: Branch Management and Landing Page
-- =====================================================

DELIMITER //

-- =====================================================
-- BRANCH STORED PROCEDURES
-- =====================================================

-- SP: sp_getAllBranches
DROP PROCEDURE IF EXISTS sp_getAllBranches//
CREATE PROCEDURE sp_getAllBranches()
BEGIN
    SELECT * FROM branch ORDER BY branch_name;
END//

-- SP: sp_getBranchById
DROP PROCEDURE IF EXISTS sp_getBranchById//
CREATE PROCEDURE sp_getBranchById(
    IN p_branch_id INT
)
BEGIN
    SELECT * FROM branch WHERE branch_id = p_branch_id;
END//

-- SP: sp_getBranchDetails
DROP PROCEDURE IF EXISTS sp_getBranchDetails//
CREATE PROCEDURE sp_getBranchDetails(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        b.*,
        COUNT(DISTINCT s.stall_id) as total_stalls,
        COUNT(DISTINCT CASE WHEN s.is_available = 1 OR s.status = 'Available' THEN s.stall_id END) as available_stalls,
        COUNT(DISTINCT CASE WHEN s.status = 'Occupied' THEN s.stall_id END) as occupied_stalls,
        COUNT(DISTINCT f.floor_id) as total_floors,
        COUNT(DISTINCT sec.section_id) as total_sections
    FROM branch b
    LEFT JOIN floor f ON b.branch_id = f.branch_id
    LEFT JOIN section sec ON f.floor_id = sec.floor_id
    LEFT JOIN stall s ON sec.section_id = s.section_id
    WHERE b.branch_id = p_branch_id
    GROUP BY b.branch_id;
END//

-- SP: sp_createBranch
DROP PROCEDURE IF EXISTS sp_createBranch//
CREATE PROCEDURE sp_createBranch(
    IN p_branch_name VARCHAR(255),
    IN p_area VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_address VARCHAR(500),
    IN p_contact_number VARCHAR(50),
    IN p_email VARCHAR(255)
)
BEGIN
    INSERT INTO branch (
        branch_name, area, location, address, contact_number, email, created_at
    ) VALUES (
        p_branch_name, p_area, p_location, p_address, p_contact_number, p_email, NOW()
    );
    
    SELECT LAST_INSERT_ID() as branch_id;
END//

-- SP: sp_updateBranch
DROP PROCEDURE IF EXISTS sp_updateBranch//
CREATE PROCEDURE sp_updateBranch(
    IN p_branch_id INT,
    IN p_branch_name VARCHAR(255),
    IN p_area VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_address VARCHAR(500),
    IN p_contact_number VARCHAR(50),
    IN p_email VARCHAR(255)
)
BEGIN
    UPDATE branch 
    SET branch_name = COALESCE(p_branch_name, branch_name),
        area = COALESCE(p_area, area),
        location = COALESCE(p_location, location),
        address = COALESCE(p_address, address),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        updated_at = NOW()
    WHERE branch_id = p_branch_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_deleteBranch
DROP PROCEDURE IF EXISTS sp_deleteBranch//
CREATE PROCEDURE sp_deleteBranch(
    IN p_branch_id INT
)
BEGIN
    DELETE FROM branch WHERE branch_id = p_branch_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- FLOOR STORED PROCEDURES
-- =====================================================

-- SP: sp_getFloorsByBranch
DROP PROCEDURE IF EXISTS sp_getFloorsByBranch//
CREATE PROCEDURE sp_getFloorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT * FROM floor WHERE branch_id = p_branch_id ORDER BY floor_number;
END//

-- SP: sp_createFloor
DROP PROCEDURE IF EXISTS sp_createFloor//
CREATE PROCEDURE sp_createFloor(
    IN p_branch_id INT,
    IN p_floor_name VARCHAR(100),
    IN p_floor_number INT
)
BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number, status, created_at)
    VALUES (p_branch_id, p_floor_name, p_floor_number, 'Active', NOW());
    
    SELECT LAST_INSERT_ID() as floor_id;
END//

-- SP: sp_getOrCreateDefaultFloor
DROP PROCEDURE IF EXISTS sp_getOrCreateDefaultFloor//
CREATE PROCEDURE sp_getOrCreateDefaultFloor(
    IN p_branch_id INT,
    OUT p_floor_id INT
)
BEGIN
    SELECT floor_id INTO p_floor_id FROM floor WHERE branch_id = p_branch_id AND status = 'Active' LIMIT 1;
    
    IF p_floor_id IS NULL THEN
        INSERT INTO floor (branch_id, floor_name, floor_number, status) 
        VALUES (p_branch_id, 'Ground Floor', 1, 'Active');
        SET p_floor_id = LAST_INSERT_ID();
    END IF;
    
    SELECT p_floor_id as floor_id;
END//

-- =====================================================
-- SECTION STORED PROCEDURES
-- =====================================================

-- SP: sp_getSectionsByFloor
DROP PROCEDURE IF EXISTS sp_getSectionsByFloor//
CREATE PROCEDURE sp_getSectionsByFloor(
    IN p_floor_id INT
)
BEGIN
    SELECT * FROM section WHERE floor_id = p_floor_id ORDER BY section_name;
END//

-- SP: sp_createSection
DROP PROCEDURE IF EXISTS sp_createSection//
CREATE PROCEDURE sp_createSection(
    IN p_floor_id INT,
    IN p_section_name VARCHAR(100)
)
BEGIN
    INSERT INTO section (floor_id, section_name, status, created_at)
    VALUES (p_floor_id, p_section_name, 'Active', NOW());
    
    SELECT LAST_INSERT_ID() as section_id;
END//

-- =====================================================
-- STALL IMAGES STORED PROCEDURES
-- =====================================================

-- SP: sp_getStallImages
DROP PROCEDURE IF EXISTS sp_getStallImages//
CREATE PROCEDURE sp_getStallImages(
    IN p_stall_id INT
)
BEGIN
    SELECT * FROM stall_images WHERE stall_id = p_stall_id ORDER BY display_order, created_at;
END//

-- SP: sp_addStallImage
DROP PROCEDURE IF EXISTS sp_addStallImage//
CREATE PROCEDURE sp_addStallImage(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_image_data MEDIUMBLOB,
    IN p_mime_type VARCHAR(100),
    IN p_file_name VARCHAR(255),
    IN p_display_order INT,
    IN p_is_primary TINYINT
)
BEGIN
    INSERT INTO stall_images (
        stall_id, image_url, image_data, mime_type, file_name, 
        display_order, is_primary, created_at
    ) VALUES (
        p_stall_id, p_image_url, p_image_data, p_mime_type, p_file_name,
        COALESCE(p_display_order, 0), COALESCE(p_is_primary, 0), NOW()
    );
    
    SELECT LAST_INSERT_ID() as image_id;
END//

-- SP: sp_deleteStallImage
DROP PROCEDURE IF EXISTS sp_deleteStallImage//
CREATE PROCEDURE sp_deleteStallImage(
    IN p_image_id INT
)
BEGIN
    DELETE FROM stall_images WHERE image_id = p_image_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_deleteStallImageByUrl
DROP PROCEDURE IF EXISTS sp_deleteStallImageByUrl//
CREATE PROCEDURE sp_deleteStallImageByUrl(
    IN p_stall_id INT,
    IN p_image_url_pattern VARCHAR(500)
)
BEGIN
    DELETE FROM stall_images WHERE stall_id = p_stall_id AND image_url LIKE p_image_url_pattern;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_getStallImagesWithBranch
DROP PROCEDURE IF EXISTS sp_getStallImagesWithBranch//
CREATE PROCEDURE sp_getStallImagesWithBranch(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        si.*,
        s.branch_id,
        s.stall_no
    FROM stall_images si
    INNER JOIN stall s ON si.stall_id = s.stall_id
    WHERE si.stall_id = p_stall_id
    ORDER BY si.display_order, si.created_at;
END//

-- =====================================================
-- DOCUMENT REQUIREMENTS STORED PROCEDURES
-- =====================================================

-- SP: sp_getDocumentRequirementsByBranch
DROP PROCEDURE IF EXISTS sp_getDocumentRequirementsByBranch//
CREATE PROCEDURE sp_getDocumentRequirementsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        bdr.*,
        dt.document_type_name,
        dt.description
    FROM branch_document_requirements bdr
    INNER JOIN document_type dt ON bdr.document_type_id = dt.document_type_id
    WHERE bdr.branch_id = p_branch_id
    ORDER BY dt.document_type_name;
END//

-- SP: sp_getDocumentTypeById
DROP PROCEDURE IF EXISTS sp_getDocumentTypeById//
CREATE PROCEDURE sp_getDocumentTypeById(
    IN p_requirement_id INT
)
BEGIN
    SELECT document_type_id FROM branch_document_requirements WHERE requirement_id = p_requirement_id LIMIT 1;
END//

-- SP: sp_createDocumentRequirement
DROP PROCEDURE IF EXISTS sp_createDocumentRequirement//
CREATE PROCEDURE sp_createDocumentRequirement(
    IN p_branch_id INT,
    IN p_document_type_id INT,
    IN p_is_required TINYINT,
    IN p_instructions TEXT,
    IN p_created_by INT
)
BEGIN
    INSERT INTO branch_document_requirements (
        branch_id, document_type_id, is_required, instructions, created_by, created_at
    ) VALUES (
        p_branch_id, p_document_type_id, COALESCE(p_is_required, 1), p_instructions, p_created_by, NOW()
    );
    
    SELECT LAST_INSERT_ID() as requirement_id;
END//

-- SP: sp_updateDocumentRequirement
DROP PROCEDURE IF EXISTS sp_updateDocumentRequirement//
CREATE PROCEDURE sp_updateDocumentRequirement(
    IN p_requirement_id INT,
    IN p_is_required TINYINT,
    IN p_instructions TEXT
)
BEGIN
    UPDATE branch_document_requirements 
    SET is_required = p_is_required, instructions = p_instructions, updated_at = NOW()
    WHERE requirement_id = p_requirement_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_deleteDocumentRequirement
DROP PROCEDURE IF EXISTS sp_deleteDocumentRequirement//
CREATE PROCEDURE sp_deleteDocumentRequirement(
    IN p_requirement_id INT
)
BEGIN
    DELETE FROM branch_document_requirements WHERE requirement_id = p_requirement_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STALLHOLDER IMPORT STORED PROCEDURES
-- =====================================================

-- SP: sp_importStallholder
DROP PROCEDURE IF EXISTS sp_importStallholder//
CREATE PROCEDURE sp_importStallholder(
    IN p_stallholder_name VARCHAR(255),
    IN p_contact_number VARCHAR(50),
    IN p_email VARCHAR(255),
    IN p_address VARCHAR(500),
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_stall_no VARCHAR(50),
    IN p_section_id INT,
    IN p_floor_id INT,
    IN p_branch_id INT,
    IN p_rental_price DECIMAL(10,2)
)
BEGIN
    DECLARE v_applicant_id INT;
    DECLARE v_stall_id INT;
    DECLARE v_stallholder_id INT;
    DECLARE v_username VARCHAR(100);
    DECLARE v_password_hash VARCHAR(255);
    
    -- Create applicant record
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applied_date, created_at
    ) VALUES (
        p_stallholder_name, p_contact_number, p_address,
        CURDATE(), NOW()
    );
    SET v_applicant_id = LAST_INSERT_ID();
    
    -- Generate credentials
    SET v_username = CONCAT('SH', LPAD(v_applicant_id, 5, '0'));
    SET v_password_hash = '$2b$12$defaultHashForImportedUsers123456789';
    
    -- Create credential
    INSERT INTO credential (applicant_id, user_name, password_hash, created_date, is_active)
    VALUES (v_applicant_id, v_username, v_password_hash, NOW(), 1);
    
    -- Create stall
    INSERT INTO stall (
        stall_no, section_id, floor_id, branch_id, rental_price, status, is_available, created_at
    ) VALUES (
        p_stall_no, p_section_id, p_floor_id, p_branch_id, p_rental_price, 'Occupied', 0, NOW()
    );
    SET v_stall_id = LAST_INSERT_ID();
    
    -- Create stallholder
    INSERT INTO stallholder (
        applicant_id, stallholder_name, contact_number, email, address,
        business_name, business_type, stall_id, branch_id,
        contract_status, created_at
    ) VALUES (
        v_applicant_id, p_stallholder_name, p_contact_number, p_email, p_address,
        p_business_name, p_business_type, v_stall_id, p_branch_id,
        'Active', NOW()
    );
    SET v_stallholder_id = LAST_INSERT_ID();
    
    -- Update stall with stallholder_id
    UPDATE stall SET stallholder_id = v_stallholder_id WHERE stall_id = v_stall_id;
    
    SELECT 
        v_applicant_id as applicant_id,
        v_stall_id as stall_id,
        v_stallholder_id as stallholder_id,
        v_username as username;
END//

-- =====================================================
-- EMPLOYEE SESSION STORED PROCEDURES
-- =====================================================

-- SP: sp_updateEmployeeSession
DROP PROCEDURE IF EXISTS sp_updateEmployeeSession//
CREATE PROCEDURE sp_updateEmployeeSession(
    IN p_employee_id INT,
    IN p_action VARCHAR(50)
)
BEGIN
    IF p_action = 'logout' THEN
        UPDATE employee_session 
        SET is_active = 0, logout_time = NOW(), last_activity = NOW()
        WHERE employee_id = p_employee_id AND is_active = 1;
    ELSE
        UPDATE employee_session SET last_activity = NOW() WHERE employee_id = p_employee_id AND is_active = 1;
    END IF;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateLastLogin
DROP PROCEDURE IF EXISTS sp_updateLastLogin//
CREATE PROCEDURE sp_updateLastLogin(
    IN p_table_name VARCHAR(50),
    IN p_user_id INT
)
BEGIN
    -- Assign procedure parameter to user variable (required for EXECUTE...USING)
    SET @user_id = p_user_id;
    SET @sql = CONCAT('UPDATE ', p_table_name, ' SET last_login = NOW() WHERE ', 
        CASE p_table_name 
            WHEN 'admin' THEN 'admin_id'
            WHEN 'branch_manager' THEN 'branch_manager_id'
            WHEN 'employee' THEN 'employee_id'
            WHEN 'inspector' THEN 'inspector_id'
            WHEN 'collector' THEN 'collector_id'
            ELSE 'id'
        END, ' = ?');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt USING @user_id;
    DEALLOCATE PREPARE stmt;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- BUSINESS OWNER/MANAGER STORED PROCEDURES
-- =====================================================

-- SP: sp_getBusinessManagerByBranch
DROP PROCEDURE IF EXISTS sp_getBusinessManagerByBranch//
CREATE PROCEDURE sp_getBusinessManagerByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT business_manager_id FROM business_manager WHERE branch_id = p_branch_id LIMIT 1;
END//

-- SP: sp_getBusinessOwnerBranches
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranches//
CREATE PROCEDURE sp_getBusinessOwnerBranches(
    IN p_business_owner_id INT
)
BEGIN
    SELECT DISTINCT bm.branch_id, bm.business_manager_id
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    WHERE bom.business_owner_id = p_business_owner_id;
END//

-- SP: sp_getBusinessOwnerBranchIds
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranchIds//
CREATE PROCEDURE sp_getBusinessOwnerBranchIds(
    IN p_business_owner_id INT
)
BEGIN
    SELECT DISTINCT bm.branch_id
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    WHERE bom.business_owner_id = p_business_owner_id;
END//

DELIMITER ;

SELECT 'Part 4 Migration Complete - Branch & Landing Page SPs created!' as status;
