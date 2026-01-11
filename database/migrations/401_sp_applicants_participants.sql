-- =====================================================
-- MIGRATION: Convert All Raw SQL to Stored Procedures
-- Part 2: Applicants and Participants Management
-- =====================================================

DELIMITER //

-- =====================================================
-- PARTICIPANTS STORED PROCEDURES
-- =====================================================

-- SP: sp_getAllParticipants
DROP PROCEDURE IF EXISTS sp_getAllParticipants//
CREATE PROCEDURE sp_getAllParticipants()
BEGIN
    SELECT 
        a.applicant_id as participant_id,
        a.applicant_full_name,
        a.applicant_contact_number as contact_number,
        a.applicant_address as address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        app.application_id,
        app.application_status,
        app.application_date,
        s.stall_id,
        s.stall_no,
        s.status as stall_status,
        s.rental_price,
        b.branch_name,
        b.area,
        b.location as branch_location,
        f.floor_name,
        sec.section_name
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.application_status = 'Approved' 
      AND s.status = 'Occupied'
    ORDER BY app.application_date DESC;
END//

-- SP: sp_getParticipantsByBranch
DROP PROCEDURE IF EXISTS sp_getParticipantsByBranch//
CREATE PROCEDURE sp_getParticipantsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        a.applicant_id as participant_id,
        a.applicant_full_name,
        a.applicant_contact_number as contact_number,
        a.applicant_address as address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        app.application_id,
        app.application_status,
        app.application_date,
        s.stall_id,
        s.stall_no,
        s.status as stall_status,
        s.rental_price,
        b.branch_name,
        b.area,
        b.location as branch_location,
        f.floor_name,
        sec.section_name
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.application_status = 'Approved' 
      AND s.status = 'Occupied'
      AND b.branch_id = p_branch_id
    ORDER BY app.application_date DESC;
END//

-- SP: sp_getParticipantsByStall
DROP PROCEDURE IF EXISTS sp_getParticipantsByStall//
CREATE PROCEDURE sp_getParticipantsByStall(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        a.applicant_id as participant_id,
        a.applicant_full_name,
        a.applicant_contact_number as contact_number,
        a.applicant_address as address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        app.application_id,
        app.application_status,
        app.application_date,
        s.stall_id,
        s.stall_no,
        s.status as stall_status,
        s.rental_price,
        b.branch_name,
        b.area,
        b.location as branch_location,
        f.floor_name,
        sec.section_name
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.application_status = 'Approved' 
      AND s.stall_id = p_stall_id
    ORDER BY app.application_date DESC;
END//

-- =====================================================
-- APPLICANTS STORED PROCEDURES
-- =====================================================

-- SP: sp_getApplicantsByBranch
DROP PROCEDURE IF EXISTS sp_getApplicantsByBranch//
CREATE PROCEDURE sp_getApplicantsByBranch(
    IN p_branch_id INT,
    IN p_application_status VARCHAR(50),
    IN p_stall_id INT,
    IN p_price_type VARCHAR(50),
    IN p_search VARCHAR(255)
)
BEGIN
    SELECT DISTINCT
        a.applicant_id,
        a.first_name,
        a.last_name,
        a.email,
        a.contact_number,
        a.address,
        a.business_type,
        a.business_name,
        a.business_description,
        a.preferred_area,
        a.preferred_location,
        a.application_status,
        a.applied_date,
        a.created_at,
        a.updated_at,
        app.application_id,
        app.application_date,
        app.application_status as current_application_status,
        s.stall_id,
        s.stall_no,
        s.rental_price,
        s.price_type,
        s.stall_location,
        s.is_available,
        s.status as stall_status,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area_name,
        b.city_name
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE b.branch_id = p_branch_id
      AND (p_application_status IS NULL OR app.application_status = p_application_status)
      AND (p_stall_id IS NULL OR s.stall_id = p_stall_id)
      AND (p_price_type IS NULL OR s.price_type = p_price_type)
      AND (p_search IS NULL OR (
        a.first_name LIKE CONCAT('%', p_search, '%') OR 
        a.last_name LIKE CONCAT('%', p_search, '%') OR
        a.email LIKE CONCAT('%', p_search, '%') OR 
        a.business_name LIKE CONCAT('%', p_search, '%') OR 
        a.business_type LIKE CONCAT('%', p_search, '%') OR
        s.stall_no LIKE CONCAT('%', p_search, '%')
      ))
    ORDER BY app.application_date DESC;
END//

-- SP: sp_getApplicantsByBranchManager
DROP PROCEDURE IF EXISTS sp_getApplicantsByBranchManager//
CREATE PROCEDURE sp_getApplicantsByBranchManager(
    IN p_manager_id INT,
    IN p_application_status VARCHAR(50),
    IN p_search VARCHAR(255)
)
BEGIN
    SELECT DISTINCT
        a.applicant_id,
        a.first_name,
        a.last_name,
        a.email,
        a.contact_number,
        a.address,
        a.business_type,
        a.business_name,
        app.application_id,
        app.application_date,
        app.application_status,
        s.stall_id,
        s.stall_no,
        s.rental_price,
        b.branch_id,
        b.branch_name
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN branch_manager bm ON b.branch_id = bm.branch_id
    WHERE bm.branch_manager_id = p_manager_id
      AND (p_application_status IS NULL OR app.application_status = p_application_status)
      AND (p_search IS NULL OR (
        a.first_name LIKE CONCAT('%', p_search, '%') OR 
        a.last_name LIKE CONCAT('%', p_search, '%') OR
        a.email LIKE CONCAT('%', p_search, '%')
      ))
    ORDER BY app.application_date DESC;
END//

-- SP: sp_getApplicantsByStall
DROP PROCEDURE IF EXISTS sp_getApplicantsByStall//
CREATE PROCEDURE sp_getApplicantsByStall(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        a.applicant_id,
        a.first_name,
        a.last_name,
        a.email,
        a.contact_number,
        a.address,
        a.business_type,
        a.business_name,
        app.application_id,
        app.application_date,
        app.application_status,
        s.stall_id,
        s.stall_no,
        s.rental_price
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    WHERE s.stall_id = p_stall_id
    ORDER BY app.application_date DESC;
END//

-- SP: sp_searchApplicants
DROP PROCEDURE IF EXISTS sp_searchApplicants//
CREATE PROCEDURE sp_searchApplicants(
    IN p_search VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        applicant_id,
        first_name,
        last_name,
        email,
        contact_number,
        address,
        business_type,
        business_name,
        application_status,
        applied_date,
        created_at
    FROM applicant
    WHERE (p_search IS NULL OR (
        first_name LIKE CONCAT('%', p_search, '%') OR 
        last_name LIKE CONCAT('%', p_search, '%') OR
        email LIKE CONCAT('%', p_search, '%') OR
        business_name LIKE CONCAT('%', p_search, '%')
    ))
    AND (p_status IS NULL OR application_status = p_status)
    ORDER BY applied_date DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- SP: sp_updateApplicantStatus
DROP PROCEDURE IF EXISTS sp_updateApplicantStatus//
CREATE PROCEDURE sp_updateApplicantStatus(
    IN p_applicant_id INT,
    IN p_status VARCHAR(50)
)
BEGIN
    UPDATE applicant SET application_status = p_status, updated_at = NOW() WHERE applicant_id = p_applicant_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateApplicationStatus
DROP PROCEDURE IF EXISTS sp_updateApplicationStatus//
CREATE PROCEDURE sp_updateApplicationStatus(
    IN p_application_id INT,
    IN p_status VARCHAR(50)
)
BEGIN
    UPDATE application SET application_status = p_status, updated_at = NOW() WHERE application_id = p_application_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- APPROVE/DECLINE APPLICANTS STORED PROCEDURES
-- =====================================================

-- SP: sp_getApplicantForApproval
DROP PROCEDURE IF EXISTS sp_getApplicantForApproval//
CREATE PROCEDURE sp_getApplicantForApproval(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        app.application_id,
        app.stall_id,
        app.application_status,
        s.stall_no,
        s.rental_price,
        s.branch_id,
        b.branch_name
    FROM applicant a
    INNER JOIN application app ON a.applicant_id = app.applicant_id
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN branch b ON s.branch_id = b.branch_id
    WHERE a.applicant_id = p_applicant_id
    ORDER BY app.created_at DESC LIMIT 1;
END//

-- SP: sp_getDeclinedApplicants
DROP PROCEDURE IF EXISTS sp_getDeclinedApplicants//
CREATE PROCEDURE sp_getDeclinedApplicants()
BEGIN
    SELECT 
        a.applicant_id,
        a.first_name,
        a.last_name,
        a.email,
        a.contact_number,
        app.application_id,
        app.application_status,
        app.application_date,
        s.stall_id,
        s.stall_no
    FROM applicant a
    LEFT JOIN application app ON a.applicant_id = app.applicant_id
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    WHERE app.application_status = 'Rejected'
    ORDER BY app.application_date DESC;
END//

-- SP: sp_createStallholder
DROP PROCEDURE IF EXISTS sp_createStallholder//
CREATE PROCEDURE sp_createStallholder(
    IN p_applicant_id INT,
    IN p_stallholder_name VARCHAR(255),
    IN p_contact_number VARCHAR(50),
    IN p_email VARCHAR(255),
    IN p_address VARCHAR(500),
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_stall_id INT,
    IN p_branch_id INT
)
BEGIN
    INSERT INTO stallholder (
        applicant_id, stallholder_name, contact_number, email, address,
        business_name, business_type, stall_id, branch_id,
        contract_status, created_at
    ) VALUES (
        p_applicant_id, p_stallholder_name, p_contact_number, p_email, p_address,
        p_business_name, p_business_type, p_stall_id, p_branch_id,
        'Active', NOW()
    );
    
    SELECT LAST_INSERT_ID() as stallholder_id;
END//

-- SP: sp_updateStallOccupied
DROP PROCEDURE IF EXISTS sp_updateStallOccupied//
CREATE PROCEDURE sp_updateStallOccupied(
    IN p_stall_id INT,
    IN p_stallholder_id INT
)
BEGIN
    UPDATE stall 
    SET status = 'Occupied', is_available = 0, stallholder_id = p_stallholder_id, updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_createApplication
DROP PROCEDURE IF EXISTS sp_createApplication//
CREATE PROCEDURE sp_createApplication(
    IN p_stall_id INT,
    IN p_applicant_id INT,
    IN p_application_status VARCHAR(50)
)
BEGIN
    INSERT INTO application (stall_id, applicant_id, application_date, application_status, created_at)
    VALUES (p_stall_id, p_applicant_id, CURDATE(), COALESCE(p_application_status, 'Pending'), NOW());
    
    SELECT LAST_INSERT_ID() as application_id;
END//

-- =====================================================
-- STALL STORED PROCEDURES
-- =====================================================

-- SP: sp_getStallById
DROP PROCEDURE IF EXISTS sp_getStallById//
CREATE PROCEDURE sp_getStallById(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE s.stall_id = p_stall_id;
END//

-- SP: sp_getStallsByBranch
DROP PROCEDURE IF EXISTS sp_getStallsByBranch//
CREATE PROCEDURE sp_getStallsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE b.branch_id = p_branch_id
    ORDER BY s.stall_no;
END//

-- SP: sp_getAvailableStallsByBranch
DROP PROCEDURE IF EXISTS sp_getAvailableStallsByBranch//
CREATE PROCEDURE sp_getAvailableStallsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE b.branch_id = p_branch_id
      AND (s.is_available = 1 OR s.status = 'Available')
    ORDER BY s.stall_no;
END//

-- SP: sp_createStall
DROP PROCEDURE IF EXISTS sp_createStall//
CREATE PROCEDURE sp_createStall(
    IN p_stall_no VARCHAR(50),
    IN p_stall_location VARCHAR(255),
    IN p_size VARCHAR(50),
    IN p_rental_price DECIMAL(10,2),
    IN p_price_type VARCHAR(50),
    IN p_section_id INT,
    IN p_floor_id INT,
    IN p_branch_id INT,
    IN p_description TEXT,
    IN p_status VARCHAR(50)
)
BEGIN
    INSERT INTO stall (
        stall_no, stall_location, size, rental_price, price_type,
        section_id, floor_id, branch_id, description, status,
        is_available, created_at
    ) VALUES (
        p_stall_no, p_stall_location, p_size, p_rental_price, COALESCE(p_price_type, 'Fixed'),
        p_section_id, p_floor_id, p_branch_id, p_description, COALESCE(p_status, 'Available'),
        1, NOW()
    );
    
    SELECT LAST_INSERT_ID() as stall_id;
END//

-- SP: sp_getAllStalls
DROP PROCEDURE IF EXISTS sp_getAllStalls//
CREATE PROCEDURE sp_getAllStalls()
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY b.branch_name, f.floor_name, sec.section_name, s.stall_no;
END//

-- SP: sp_getStallsByLocation
DROP PROCEDURE IF EXISTS sp_getStallsByLocation//
CREATE PROCEDURE sp_getStallsByLocation(
    IN p_location VARCHAR(255)
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE b.location = p_location OR b.area = p_location
    ORDER BY s.stall_no;
END//

-- SP: sp_getStallsByArea
DROP PROCEDURE IF EXISTS sp_getStallsByArea//
CREATE PROCEDURE sp_getStallsByArea(
    IN p_area VARCHAR(255)
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE b.area = p_area
    ORDER BY s.stall_no;
END//

-- SP: sp_getFilteredStalls
DROP PROCEDURE IF EXISTS sp_getFilteredStalls//
CREATE PROCEDURE sp_getFilteredStalls(
    IN p_branch_id INT,
    IN p_status VARCHAR(50),
    IN p_price_type VARCHAR(50),
    IN p_min_price DECIMAL(10,2),
    IN p_max_price DECIMAL(10,2)
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR s.status = p_status)
      AND (p_price_type IS NULL OR s.price_type = p_price_type)
      AND (p_min_price IS NULL OR s.rental_price >= p_min_price)
      AND (p_max_price IS NULL OR s.rental_price <= p_max_price)
    ORDER BY s.stall_no;
END//

-- SP: sp_getAvailableMarkets
DROP PROCEDURE IF EXISTS sp_getAvailableMarkets//
CREATE PROCEDURE sp_getAvailableMarkets()
BEGIN
    SELECT DISTINCT
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        COUNT(s.stall_id) as available_stalls
    FROM branch b
    INNER JOIN stall s ON b.branch_id = s.branch_id
    WHERE s.is_available = 1 OR s.status = 'Available'
    GROUP BY b.branch_id, b.branch_name, b.area, b.location
    ORDER BY b.branch_name;
END//

-- SP: sp_getAreas
DROP PROCEDURE IF EXISTS sp_getAreas//
CREATE PROCEDURE sp_getAreas()
BEGIN
    SELECT DISTINCT area FROM branch WHERE area IS NOT NULL ORDER BY area;
END//

-- SP: sp_getCities
DROP PROCEDURE IF EXISTS sp_getCities//
CREATE PROCEDURE sp_getCities()
BEGIN
    SELECT DISTINCT city FROM area WHERE city IS NOT NULL ORDER BY city;
END//

DELIMITER ;

SELECT 'Part 2 Migration Complete - Applicants & Participants SPs created!' as status;
