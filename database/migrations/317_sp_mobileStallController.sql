-- Migration 317: Mobile Stall Controller Stored Procedures
-- This creates stored procedures for mobile app stall queries

DELIMITER //

-- =====================================================
-- SP: sp_getAppliedAreasForApplicant
-- Purpose: Get areas where applicant has applied
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAppliedAreasForApplicant//
CREATE PROCEDURE sp_getAppliedAreasForApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT DISTINCT b.area, b.branch_id, b.branch_name, b.location
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id;
END//

-- =====================================================
-- SP: sp_getAvailableStallsForApplicant
-- Purpose: Get available stalls in applicant's applied areas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAvailableStallsForApplicant//
CREATE PROCEDURE sp_getAvailableStallsForApplicant(
    IN p_applicant_id INT,
    IN p_area_list TEXT
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
            st.price_type, st.status, st.description, st.is_available,
            si.image_url as stall_image,
            sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
            b.branch_name, b.area, b.location, b.branch_id,
            CASE 
                WHEN app_check.stall_id IS NOT NULL THEN ''applied''
                ELSE ''available''
            END as application_status
        FROM stall st
        JOIN section sec ON st.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stall_images si ON st.stall_id = si.stall_id AND si.is_primary = 1
        LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = ', p_applicant_id, '
        WHERE st.is_available = 1 AND st.status = ''Active'' AND b.area IN (', p_area_list, ')
        ORDER BY st.price_type, b.branch_name, f.floor_name, sec.section_name, st.stall_no
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_getStallsByTypeForApplicant
-- Purpose: Get stalls by price type restricted to applicant's areas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallsByTypeForApplicant//
CREATE PROCEDURE sp_getStallsByTypeForApplicant(
    IN p_applicant_id INT,
    IN p_price_type VARCHAR(50),
    IN p_area_list TEXT
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
            st.price_type, st.status, st.description, st.is_available,
            si.image_url as stall_image,
            sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
            b.branch_name, b.area, b.location, b.branch_id,
            CASE 
                WHEN app_check.stall_id IS NOT NULL THEN ''applied''
                ELSE ''available''
            END as application_status
        FROM stall st
        JOIN section sec ON st.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stall_images si ON st.stall_id = si.stall_id AND si.is_primary = 1
        LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = ', p_applicant_id, '
        WHERE st.is_available = 1 AND st.status = ''Active'' AND st.price_type = ''', p_price_type, ''' AND b.area IN (', p_area_list, ')
        ORDER BY b.branch_name, f.floor_name, sec.section_name, st.stall_no
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_getStallsByAreaForApplicant
-- Purpose: Get stalls by specific area with optional type filter
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallsByAreaForApplicant//
CREATE PROCEDURE sp_getStallsByAreaForApplicant(
    IN p_applicant_id INT,
    IN p_area VARCHAR(255),
    IN p_price_type VARCHAR(50)
)
BEGIN
    IF p_price_type IS NOT NULL AND p_price_type != '' THEN
        SELECT 
            st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
            st.price_type, st.status, st.description, st.is_available,
            si.image_url as stall_image,
            sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
            b.branch_name, b.area, b.location, b.branch_id,
            CASE 
                WHEN app_check.stall_id IS NOT NULL THEN 'applied'
                ELSE 'available'
            END as application_status
        FROM stall st
        JOIN section sec ON st.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stall_images si ON st.stall_id = si.stall_id AND si.is_primary = 1
        LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = p_applicant_id
        WHERE st.is_available = 1 AND st.status = 'Active' AND b.area = p_area AND st.price_type = p_price_type
        ORDER BY st.price_type, b.branch_name, f.floor_name, sec.section_name, st.stall_no;
    ELSE
        SELECT 
            st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
            st.price_type, st.status, st.description, st.is_available,
            si.image_url as stall_image,
            sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
            b.branch_name, b.area, b.location, b.branch_id,
            CASE 
                WHEN app_check.stall_id IS NOT NULL THEN 'applied'
                ELSE 'available'
            END as application_status
        FROM stall st
        JOIN section sec ON st.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stall_images si ON st.stall_id = si.stall_id AND si.is_primary = 1
        LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = p_applicant_id
        WHERE st.is_available = 1 AND st.status = 'Active' AND b.area = p_area
        ORDER BY st.price_type, b.branch_name, f.floor_name, sec.section_name, st.stall_no;
    END IF;
END//

-- =====================================================
-- SP: sp_getStallDetailForApplicant
-- Purpose: Get stall detail by ID with applicant's application status
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallDetailForApplicant//
CREATE PROCEDURE sp_getStallDetailForApplicant(
    IN p_stall_id INT,
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
        st.price_type, st.status, st.description, st.is_available,
        si.image_url as stall_image,
        st.created_at, st.updated_at,
        sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
        b.branch_name, b.area, b.location, b.branch_id, b.address as branch_address,
        CASE 
            WHEN app_check.stall_id IS NOT NULL THEN 'applied'
            ELSE 'available'
        END as application_status,
        app_check.application_id, app_check.application_date, app_check.application_status as app_status
    FROM stall st
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stall_images si ON st.stall_id = si.stall_id AND si.is_primary = 1
    LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = p_applicant_id
    WHERE st.stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_countBranchApplications
-- Purpose: Count applicant's applications in a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_countBranchApplications//
CREATE PROCEDURE sp_countBranchApplications(
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT COUNT(*) as count 
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getAvailableAreasForApplicant
-- Purpose: Get areas with stall counts for applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAvailableAreasForApplicant//
CREATE PROCEDURE sp_getAvailableAreasForApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT DISTINCT b.area, b.location, 
           COUNT(st.stall_id) as stall_count,
           COUNT(CASE WHEN st.is_available = 1 AND st.status = 'Active' THEN 1 END) as available_stall_count
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.is_active = 1
    GROUP BY b.area, b.location
    ORDER BY b.area, b.location;
END//

-- =====================================================
-- SP: sp_searchStallsForApplicant
-- Purpose: Search stalls with filters for applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_searchStallsForApplicant//
CREATE PROCEDURE sp_searchStallsForApplicant(
    IN p_applicant_id INT,
    IN p_area_list TEXT,
    IN p_type VARCHAR(50),
    IN p_area VARCHAR(255),
    IN p_min_price DECIMAL(10,2),
    IN p_max_price DECIMAL(10,2),
    IN p_size VARCHAR(100),
    IN p_search_term VARCHAR(255)
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
            st.price_type, st.status, st.description, st.is_available,
            si.image_url as stall_image,
            sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
            b.branch_name, b.area, b.location, b.branch_id,
            CASE 
                WHEN app_check.stall_id IS NOT NULL THEN ''applied''
                ELSE ''available''
            END as application_status
        FROM stall st
        JOIN section sec ON st.section_id = sec.section_id
        JOIN floor f ON sec.floor_id = f.floor_id
        JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stall_images si ON st.stall_id = si.stall_id AND si.is_primary = 1
        LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = ', p_applicant_id, '
        WHERE st.is_available = 1 AND st.status = ''Active'' AND b.area IN (', p_area_list, ')');

    -- Add type filter
    IF p_type IS NOT NULL AND p_type != '' THEN
        SET @sql = CONCAT(@sql, ' AND st.price_type = ''', p_type, '''');
    END IF;

    -- Add area filter
    IF p_area IS NOT NULL AND p_area != '' THEN
        SET @sql = CONCAT(@sql, ' AND b.area = ''', p_area, '''');
    END IF;

    -- Add price filters
    IF p_min_price IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND st.rental_price >= ', p_min_price);
    END IF;

    IF p_max_price IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND st.rental_price <= ', p_max_price);
    END IF;

    -- Add size filter
    IF p_size IS NOT NULL AND p_size != '' THEN
        SET @sql = CONCAT(@sql, ' AND st.size LIKE ''%', p_size, '%''');
    END IF;

    -- Add search term filter
    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @sql = CONCAT(@sql, ' AND (st.stall_no LIKE ''%', p_search_term, '%'' OR st.stall_location LIKE ''%', p_search_term, '%'' OR st.description LIKE ''%', p_search_term, '%'' OR b.branch_name LIKE ''%', p_search_term, '%'')');
    END IF;

    SET @sql = CONCAT(@sql, ' ORDER BY st.price_type, b.branch_name, st.stall_no');

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_getStallImagesPublic
-- Purpose: Get all images for a stall (with mime_type and file_name)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImagesPublic//
CREATE PROCEDURE sp_getStallImagesPublic(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        si.id,
        si.stall_id,
        si.image_url,
        si.is_primary,
        si.display_order,
        si.created_at,
        si.mime_type,
        si.file_name
    FROM stall_images si
    WHERE si.stall_id = p_stall_id
    ORDER BY si.is_primary DESC, si.display_order ASC, si.id ASC;
END//

-- =====================================================
-- SP: sp_checkApplicantAreaAccess
-- Purpose: Check if applicant has access to a specific area
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkApplicantAreaAccess//
CREATE PROCEDURE sp_checkApplicantAreaAccess(
    IN p_applicant_id INT,
    IN p_area VARCHAR(255)
)
BEGIN
    SELECT COUNT(*) as has_access
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.area = p_area;
END//

DELIMITER ;

-- Success message
SELECT 'Mobile Stall Controller stored procedures created successfully' as status;
