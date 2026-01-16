-- ========================================
-- NAGA STALL - STORED PROCEDURES (PART 3)
-- ========================================
-- Branch, Stall, Payment, and Utility Procedures
-- ========================================

USE naga_stall;

DELIMITER $$

-- ========================================
-- BRANCH PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS createBranch$$
CREATE PROCEDURE createBranch(
    IN p_business_owner_id INT,
    IN p_business_manager_id INT,
    IN p_branch_name VARCHAR(100),
    IN p_area VARCHAR(100),
    IN p_location VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(100)
)
BEGIN
    INSERT INTO branch (
        business_owner_id, business_manager_id, branch_name, area,
        location, address, contact_number, email, status
    ) VALUES (
        p_business_owner_id, p_business_manager_id, p_branch_name, p_area,
        p_location, p_address, p_contact_number, p_email, 'Active'
    );
    
    SELECT LAST_INSERT_ID() AS branch_id, 'Branch created successfully' AS message;
END$$

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
        b.business_owner_id,
        b.business_manager_id,
        bm.first_name AS manager_first_name,
        bm.last_name AS manager_last_name
    FROM branch b
    LEFT JOIN business_manager bm ON b.business_manager_id = bm.business_manager_id
    ORDER BY b.branch_id;
END$$

DROP PROCEDURE IF EXISTS getBranchById$$
CREATE PROCEDURE getBranchById(IN p_branch_id INT)
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
        b.business_owner_id,
        b.business_manager_id
    FROM branch b
    WHERE b.branch_id = p_branch_id;
END$$

-- ========================================
-- FLOOR PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS createFloor$$
CREATE PROCEDURE createFloor(
    IN p_branch_id INT,
    IN p_floor_name VARCHAR(100),
    IN p_floor_number INT,
    IN p_description TEXT
)
BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number, description, status)
    VALUES (p_branch_id, p_floor_name, IFNULL(p_floor_number, 1), p_description, 'Active');
    
    SELECT LAST_INSERT_ID() AS floor_id, 'Floor created successfully' AS message;
END$$

DROP PROCEDURE IF EXISTS getFloorsByBranch$$
CREATE PROCEDURE getFloorsByBranch(IN p_branch_id INT)
BEGIN
    SELECT floor_id, branch_id, floor_name, floor_number, description, status
    FROM floor
    WHERE branch_id = p_branch_id AND status = 'Active'
    ORDER BY floor_number;
END$$

-- ========================================
-- SECTION PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS createSection$$
CREATE PROCEDURE createSection(
    IN p_floor_id INT,
    IN p_section_name VARCHAR(100),
    IN p_description TEXT
)
BEGIN
    INSERT INTO section (floor_id, section_name, description, status)
    VALUES (p_floor_id, p_section_name, p_description, 'Active');
    
    SELECT LAST_INSERT_ID() AS section_id, 'Section created successfully' AS message;
END$$

DROP PROCEDURE IF EXISTS getSectionsByBranch$$
CREATE PROCEDURE getSectionsByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        s.section_id,
        s.floor_id,
        f.floor_name,
        s.section_name,
        s.description,
        s.status
    FROM section s
    INNER JOIN floor f ON s.floor_id = f.floor_id
    WHERE f.branch_id = p_branch_id AND s.status = 'Active'
    ORDER BY f.floor_number, s.section_name;
END$$

-- ========================================
-- STALL PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS createStall$$
CREATE PROCEDURE createStall(
    IN p_section_id INT,
    IN p_branch_id INT,
    IN p_stall_number VARCHAR(50),
    IN p_stall_name VARCHAR(100),
    IN p_stall_type VARCHAR(50),
    IN p_size VARCHAR(50),
    IN p_monthly_rent DECIMAL(10,2),
    IN p_description TEXT
)
BEGIN
    INSERT INTO stall (
        section_id, branch_id, stall_number, stall_name,
        stall_type, size, monthly_rent, description, status, is_available
    ) VALUES (
        p_section_id, p_branch_id, p_stall_number, p_stall_name,
        p_stall_type, p_size, IFNULL(p_monthly_rent, 0), p_description, 'Available', 1
    );
    
    SELECT LAST_INSERT_ID() AS stall_id, 'Stall created successfully' AS message;
END$$

DROP PROCEDURE IF EXISTS getAllStalls$$
CREATE PROCEDURE getAllStalls()
BEGIN
    SELECT 
        st.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        st.size,
        st.monthly_rent,
        st.status,
        st.is_available,
        st.description,
        st.section_id,
        sec.section_name,
        f.floor_id,
        f.floor_name,
        st.branch_id,
        b.branch_name,
        st.stallholder_id,
        sh.stallholder_name
    FROM stall st
    INNER JOIN section sec ON st.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON st.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON st.stallholder_id = sh.stallholder_id
    ORDER BY b.branch_name, f.floor_number, sec.section_name, st.stall_number;
END$$

DROP PROCEDURE IF EXISTS getStallById$$
CREATE PROCEDURE getStallById(IN p_stall_id INT)
BEGIN
    SELECT 
        st.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        st.size,
        st.monthly_rent,
        st.status,
        st.is_available,
        st.description,
        st.section_id,
        sec.section_name,
        f.floor_id,
        f.floor_name,
        st.branch_id,
        b.branch_name,
        st.stallholder_id,
        sh.stallholder_name
    FROM stall st
    INNER JOIN section sec ON st.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON st.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON st.stallholder_id = sh.stallholder_id
    WHERE st.stall_id = p_stall_id;
END$$

DROP PROCEDURE IF EXISTS getStallsByBranch$$
CREATE PROCEDURE getStallsByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        st.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        st.size,
        st.monthly_rent,
        st.status,
        st.is_available,
        sec.section_name,
        f.floor_name,
        st.stallholder_id,
        sh.stallholder_name
    FROM stall st
    INNER JOIN section sec ON st.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN stallholder sh ON st.stallholder_id = sh.stallholder_id
    WHERE st.branch_id = p_branch_id
    ORDER BY f.floor_number, sec.section_name, st.stall_number;
END$$

DROP PROCEDURE IF EXISTS getAvailableStalls$$
CREATE PROCEDURE getAvailableStalls(IN p_branch_id INT)
BEGIN
    SELECT 
        st.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        st.size,
        st.monthly_rent,
        sec.section_name,
        f.floor_name,
        b.branch_name
    FROM stall st
    INNER JOIN section sec ON st.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON st.branch_id = b.branch_id
    WHERE st.is_available = 1 AND st.status = 'Available'
    AND (p_branch_id IS NULL OR st.branch_id = p_branch_id)
    ORDER BY b.branch_name, f.floor_number, sec.section_name, st.stall_number;
END$$

-- ========================================
-- PAYMENT PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS addOnsitePayment$$
CREATE PROCEDURE addOnsitePayment(
    IN p_stallholder_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_date DATE,
    IN p_payment_time TIME,
    IN p_payment_for_month VARCHAR(7),
    IN p_payment_type VARCHAR(50),
    IN p_reference_number VARCHAR(100),
    IN p_collected_by VARCHAR(100),
    IN p_notes TEXT,
    IN p_branch_id INT,
    IN p_created_by INT
)
BEGIN
    DECLARE payment_id INT;
    
    INSERT INTO payments (
        stallholder_id, amount, payment_date, payment_time, payment_for_month,
        payment_type, payment_method, reference_number, collected_by, notes,
        payment_status, branch_id, created_by
    ) VALUES (
        p_stallholder_id, p_amount, p_payment_date, p_payment_time, p_payment_for_month,
        p_payment_type, 'onsite', p_reference_number, p_collected_by, p_notes,
        'completed', p_branch_id, p_created_by
    );
    
    SET payment_id = LAST_INSERT_ID();
    
    -- Update stallholder payment status
    UPDATE stallholder
    SET last_payment_date = p_payment_date,
        payment_status = 'paid',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    SELECT payment_id, 1 AS success, 'Payment recorded successfully' AS message;
END$$

DROP PROCEDURE IF EXISTS getPaymentsByStallholder$$
CREATE PROCEDURE getPaymentsByStallholder(IN p_stallholder_id INT)
BEGIN
    SELECT 
        p.payment_id,
        p.stallholder_id,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.payment_method,
        p.reference_number,
        p.collected_by,
        p.notes,
        p.payment_status,
        p.created_at
    FROM payments p
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC, p.payment_time DESC;
END$$

DROP PROCEDURE IF EXISTS getAllPayments$$
CREATE PROCEDURE getAllPayments()
BEGIN
    SELECT 
        p.payment_id,
        p.stallholder_id,
        sh.stallholder_name,
        p.amount,
        p.payment_date,
        p.payment_for_month,
        p.payment_type,
        p.payment_method,
        p.payment_status,
        p.branch_id,
        b.branch_name
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN branch b ON p.branch_id = b.branch_id
    ORDER BY p.payment_date DESC;
END$$

-- ========================================
-- VIOLATION PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS getAllViolationTypes$$
CREATE PROCEDURE getAllViolationTypes()
BEGIN
    SELECT 
        v.violation_id,
        v.violation_type,
        v.description,
        v.default_penalty,
        v.status
    FROM violation v
    WHERE v.status = 'Active'
    ORDER BY v.violation_type;
END$$

DROP PROCEDURE IF EXISTS reportViolation$$
CREATE PROCEDURE reportViolation(
    IN p_stallholder_id INT,
    IN p_violation_id INT,
    IN p_reported_by INT,
    IN p_remarks TEXT
)
BEGIN
    DECLARE v_offense_count INT DEFAULT 1;
    DECLARE v_penalty_amount DECIMAL(10,2) DEFAULT 0;
    
    -- Count previous offenses
    SELECT COUNT(*) + 1 INTO v_offense_count
    FROM violation_report
    WHERE stallholder_id = p_stallholder_id AND violation_id = p_violation_id;
    
    -- Get penalty amount based on offense level
    SELECT penalty_amount INTO v_penalty_amount
    FROM violation_penalty
    WHERE violation_id = p_violation_id
    AND offense_level = CASE 
        WHEN v_offense_count >= 5 THEN '5th'
        WHEN v_offense_count = 4 THEN '4th'
        WHEN v_offense_count = 3 THEN '3rd'
        WHEN v_offense_count = 2 THEN '2nd'
        ELSE '1st'
    END
    LIMIT 1;
    
    INSERT INTO violation_report (
        stallholder_id, violation_id, reported_by, offense_count,
        penalty_amount, remarks, status
    ) VALUES (
        p_stallholder_id, p_violation_id, p_reported_by, v_offense_count,
        IFNULL(v_penalty_amount, 0), p_remarks, 'Open'
    );
    
    SELECT LAST_INSERT_ID() AS report_id, v_offense_count AS offense_count, 
           v_penalty_amount AS penalty_amount, 'Violation reported successfully' AS message;
END$$

-- ========================================
-- COMPLAINT PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS createComplaint$$
CREATE PROCEDURE createComplaint(
    IN p_complainant_type ENUM('Stallholder','Applicant','Anonymous'),
    IN p_complainant_id INT,
    IN p_complainant_name VARCHAR(500),
    IN p_complainant_contact VARCHAR(500),
    IN p_complained_id INT,
    IN p_complained_type ENUM('Stallholder','Inspector','Collector','Employee'),
    IN p_complaint_type VARCHAR(100),
    IN p_complaint_details TEXT,
    IN p_branch_id INT
)
BEGIN
    INSERT INTO complaint (
        complainant_type, complainant_id, complainant_name, complainant_contact,
        complained_id, complained_type, complaint_type, complaint_details,
        branch_id, status
    ) VALUES (
        p_complainant_type, p_complainant_id, p_complainant_name, p_complainant_contact,
        p_complained_id, p_complained_type, p_complaint_type, p_complaint_details,
        p_branch_id, 'Pending'
    );
    
    SELECT LAST_INSERT_ID() AS complaint_id, 'Complaint submitted successfully' AS message;
END$$

DROP PROCEDURE IF EXISTS getAllComplaints$$
CREATE PROCEDURE getAllComplaints()
BEGIN
    SELECT 
        c.complaint_id,
        c.complainant_type,
        c.complainant_id,
        c.complainant_name,
        c.complainant_contact,
        c.complained_id,
        c.complained_type,
        c.complaint_type,
        c.complaint_details,
        c.branch_id,
        b.branch_name,
        c.status,
        c.resolved_by,
        c.resolved_at,
        c.resolution_notes,
        c.created_at
    FROM complaint c
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    ORDER BY c.created_at DESC;
END$$

-- ========================================
-- DOCUMENT PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS addBranchDocumentRequirement$$
CREATE PROCEDURE addBranchDocumentRequirement(
    IN p_branch_id INT,
    IN p_document_name VARCHAR(255),
    IN p_description TEXT,
    IN p_is_required TINYINT,
    IN p_created_by INT
)
BEGIN
    INSERT INTO branch_document_requirements (
        branch_id, document_name, description, is_required, created_by
    ) VALUES (
        p_branch_id, p_document_name, p_description, IFNULL(p_is_required, 1), p_created_by
    );
    
    SELECT LAST_INSERT_ID() AS document_requirement_id, 'Document requirement added' AS message;
END$$

DROP PROCEDURE IF EXISTS getBranchDocumentRequirements$$
CREATE PROCEDURE getBranchDocumentRequirements(IN p_branch_id INT)
BEGIN
    SELECT 
        document_requirement_id,
        branch_id,
        document_name,
        description,
        is_required,
        created_at
    FROM branch_document_requirements
    WHERE branch_id = p_branch_id
    ORDER BY document_name;
END$$

-- ========================================
-- LOGIN/SESSION PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS updateInspectorLastLogin$$
CREATE PROCEDURE updateInspectorLastLogin(IN p_inspector_id INT)
BEGIN
    UPDATE inspector SET last_login = NOW() WHERE inspector_id = p_inspector_id;
END$$

DROP PROCEDURE IF EXISTS updateCollectorLastLogin$$
CREATE PROCEDURE updateCollectorLastLogin(IN p_collector_id INT)
BEGIN
    UPDATE collector SET last_login = NOW() WHERE collector_id = p_collector_id;
END$$

DROP PROCEDURE IF EXISTS updateBusinessEmployeeLastLogin$$
CREATE PROCEDURE updateBusinessEmployeeLastLogin(IN p_employee_id INT)
BEGIN
    UPDATE business_employee SET last_login = NOW() WHERE business_employee_id = p_employee_id;
END$$

DROP PROCEDURE IF EXISTS updateBusinessManagerLastLogin$$
CREATE PROCEDURE updateBusinessManagerLastLogin(IN p_manager_id INT)
BEGIN
    UPDATE business_manager SET last_login = NOW() WHERE business_manager_id = p_manager_id;
END$$

-- ========================================
-- STALL IMAGE PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS addStallImage$$
CREATE PROCEDURE addStallImage(
    IN p_stall_id INT,
    IN p_image_data LONGBLOB,
    IN p_image_mime_type VARCHAR(100),
    IN p_image_name VARCHAR(255),
    IN p_is_primary TINYINT
)
BEGIN
    DECLARE v_display_order INT;
    
    -- Get next display order
    SELECT IFNULL(MAX(display_order), 0) + 1 INTO v_display_order
    FROM stall_images WHERE stall_id = p_stall_id;
    
    -- If this is primary, unset other primaries
    IF p_is_primary = 1 THEN
        UPDATE stall_images SET is_primary = 0 WHERE stall_id = p_stall_id;
    END IF;
    
    INSERT INTO stall_images (
        stall_id, image_data, image_mime_type, image_name, is_primary, display_order
    ) VALUES (
        p_stall_id, p_image_data, p_image_mime_type, p_image_name, 
        IFNULL(p_is_primary, 0), v_display_order
    );
    
    SELECT LAST_INSERT_ID() AS image_id, 'Image uploaded successfully' AS message;
END$$

DROP PROCEDURE IF EXISTS getStallImages$$
CREATE PROCEDURE getStallImages(IN p_stall_id INT)
BEGIN
    SELECT 
        image_id,
        stall_id,
        image_mime_type,
        image_name,
        is_primary,
        display_order,
        created_at
    FROM stall_images
    WHERE stall_id = p_stall_id
    ORDER BY is_primary DESC, display_order;
END$$

DROP PROCEDURE IF EXISTS getStallImageData$$
CREATE PROCEDURE getStallImageData(IN p_image_id INT)
BEGIN
    SELECT 
        image_id,
        stall_id,
        image_data,
        image_mime_type,
        image_name
    FROM stall_images
    WHERE image_id = p_image_id;
END$$

DROP PROCEDURE IF EXISTS deleteStallImage$$
CREATE PROCEDURE deleteStallImage(IN p_image_id INT)
BEGIN
    DELETE FROM stall_images WHERE image_id = p_image_id;
    SELECT 'Image deleted successfully' AS message;
END$$

-- ========================================
-- SYSTEM ADMIN PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS getSystemAdminByUsername$$
CREATE PROCEDURE getSystemAdminByUsername(IN p_username VARCHAR(50))
BEGIN
    SELECT 
        system_admin_id,
        admin_username,
        admin_password_hash,
        first_name,
        last_name,
        email,
        status
    FROM system_administrator
    WHERE admin_username = p_username AND status = 'Active';
END$$

-- ========================================
-- LANDING PAGE PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS getLandingPageStats$$
CREATE PROCEDURE getLandingPageStats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM branch WHERE status = 'Active') AS total_branches,
        (SELECT COUNT(*) FROM stall WHERE is_available = 1) AS available_stalls,
        (SELECT COUNT(*) FROM stallholder WHERE status = 'active') AS total_stallholders;
END$$

DROP PROCEDURE IF EXISTS getLandingPageStalls$$
CREATE PROCEDURE getLandingPageStalls(
    IN p_branch_id INT,
    IN p_stall_type VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- Declare variables for LIMIT/OFFSET (MySQL doesn't allow expressions in LIMIT clause)
    DECLARE v_limit INT DEFAULT 20;
    DECLARE v_offset INT DEFAULT 0;
    
    -- Set the values
    IF p_limit IS NOT NULL THEN
        SET v_limit = p_limit;
    END IF;
    
    IF p_offset IS NOT NULL THEN
        SET v_offset = p_offset;
    END IF;
    
    -- Use prepared statement for dynamic LIMIT/OFFSET
    SET @sql = CONCAT(
        'SELECT 
            st.stall_id,
            st.stall_number,
            st.stall_name,
            st.stall_type,
            st.size,
            st.monthly_rent,
            st.status,
            sec.section_name,
            f.floor_name,
            b.branch_id,
            b.branch_name,
            b.area
        FROM stall st
        INNER JOIN section sec ON st.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON st.branch_id = b.branch_id
        WHERE st.is_available = 1 AND st.status = ''Available''',
        CASE WHEN p_branch_id IS NOT NULL THEN CONCAT(' AND st.branch_id = ', p_branch_id) ELSE '' END,
        CASE WHEN p_stall_type IS NOT NULL THEN CONCAT(' AND st.stall_type = ''', p_stall_type, '''') ELSE '' END,
        ' ORDER BY st.monthly_rent',
        ' LIMIT ', v_limit, ' OFFSET ', v_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
