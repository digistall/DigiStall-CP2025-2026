-- Migration 313: Stallholder Controller Stored Procedures
-- This creates stored procedures for stallholder operations

DELIMITER //

-- =====================================================
-- SP: sp_getAllStallholdersAll
-- Purpose: Get all stallholders (for system admin)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllStallholdersAll//
CREATE PROCEDURE sp_getAllStallholdersAll()
BEGIN
    SELECT sh.*, b.branch_name, st.stall_no
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    ORDER BY sh.date_created DESC;
END//

-- =====================================================
-- SP: sp_getAllStallholdersByBranches
-- Purpose: Get stallholders filtered by branch IDs
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllStallholdersByBranches//
CREATE PROCEDURE sp_getAllStallholdersByBranches(
    IN p_branch_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('
        SELECT sh.*, b.branch_name, st.stall_no
        FROM stallholder sh
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        WHERE sh.branch_id IN (', p_branch_ids, ')
        ORDER BY sh.date_created DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_getFirstFloorByBranch
-- Purpose: Get first active floor for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getFirstFloorByBranch//
CREATE PROCEDURE sp_getFirstFloorByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT floor_id, floor_name 
    FROM floor 
    WHERE branch_id = p_branch_id AND status = 'Active' 
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getFirstSectionByFloor
-- Purpose: Get first active section for a floor
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getFirstSectionByFloor//
CREATE PROCEDURE sp_getFirstSectionByFloor(
    IN p_floor_id INT
)
BEGIN
    SELECT section_id 
    FROM section 
    WHERE floor_id = p_floor_id AND status = 'Active' 
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_createDefaultSection
-- Purpose: Create default section for a floor
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createDefaultSection//
CREATE PROCEDURE sp_createDefaultSection(
    IN p_floor_id INT,
    IN p_section_name VARCHAR(100)
)
BEGIN
    INSERT INTO section (floor_id, section_name, status) 
    VALUES (p_floor_id, p_section_name, 'Active');
    
    SELECT LAST_INSERT_ID() as section_id;
END//

-- =====================================================
-- SP: sp_createDefaultFloor
-- Purpose: Create default floor for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createDefaultFloor//
CREATE PROCEDURE sp_createDefaultFloor(
    IN p_branch_id INT,
    IN p_floor_name VARCHAR(100)
)
BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number, status) 
    VALUES (p_branch_id, p_floor_name, 1, 'Active');
    
    SELECT LAST_INSERT_ID() as floor_id;
END//

-- =====================================================
-- SP: sp_getFloorsByBranch
-- Purpose: Get all floors for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getFloorsByBranch//
CREATE PROCEDURE sp_getFloorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT floor_id, UPPER(floor_name) as floor_name 
    FROM floor 
    WHERE branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getSectionsByFloors
-- Purpose: Get sections for multiple floors
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getSectionsByFloors//
CREATE PROCEDURE sp_getSectionsByFloors(
    IN p_floor_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('
        SELECT s.section_id, s.floor_id, UPPER(s.section_name) as section_name 
        FROM section s 
        WHERE s.floor_id IN (', p_floor_ids, ')'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_findStallByFloorSectionNo
-- Purpose: Find stall by floor, section and stall number
-- =====================================================
DROP PROCEDURE IF EXISTS sp_findStallByFloorSectionNo//
CREATE PROCEDURE sp_findStallByFloorSectionNo(
    IN p_floor_id INT,
    IN p_section_id INT,
    IN p_stall_no VARCHAR(50)
)
BEGIN
    SELECT s.stall_id 
    FROM stall s 
    WHERE s.floor_id = p_floor_id 
    AND s.section_id = p_section_id 
    AND UPPER(s.stall_no) = UPPER(p_stall_no);
END//

-- =====================================================
-- SP: sp_updateStallForOccupancy
-- Purpose: Update stall with rental info and mark as occupied
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateStallForOccupancy//
CREATE PROCEDURE sp_updateStallForOccupancy(
    IN p_stall_id INT,
    IN p_rental_price DECIMAL(10,2)
)
BEGIN
    UPDATE stall 
    SET rental_price = p_rental_price, 
        is_available = 0, 
        status = 'Occupied', 
        updated_at = NOW() 
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_createStallForImport
-- Purpose: Create new stall during import
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createStallForImport//
CREATE PROCEDURE sp_createStallForImport(
    IN p_section_id INT,
    IN p_floor_id INT,
    IN p_stall_no VARCHAR(50),
    IN p_stall_location VARCHAR(255),
    IN p_size VARCHAR(50),
    IN p_rental_price DECIMAL(10,2)
)
BEGIN
    INSERT INTO stall (
        section_id, floor_id, stall_no, stall_location, size, rental_price, 
        is_available, status, date_added
    ) VALUES (
        p_section_id, p_floor_id, p_stall_no, p_stall_location, p_size, p_rental_price,
        0, 'Occupied', NOW()
    );
    
    SELECT LAST_INSERT_ID() as stall_id;
END//

-- =====================================================
-- SP: sp_createStallholderFromImport
-- Purpose: Create stallholder from Excel import
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createStallholderFromImport//
CREATE PROCEDURE sp_createStallholderFromImport(
    IN p_branch_id INT,
    IN p_stall_id INT,
    IN p_stallholder_name VARCHAR(255),
    IN p_contact_number VARCHAR(50),
    IN p_email VARCHAR(255),
    IN p_address TEXT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_contract_start_date DATE,
    IN p_contract_end_date DATE,
    IN p_lease_amount DECIMAL(10,2),
    IN p_monthly_rent DECIMAL(10,2),
    IN p_contract_status VARCHAR(50),
    IN p_payment_status VARCHAR(50),
    IN p_notes TEXT,
    IN p_manager_id INT
)
BEGIN
    INSERT INTO stallholder (
        branch_id, stall_id, stallholder_name, contact_number, email, address,
        business_name, business_type, contract_start_date, contract_end_date,
        lease_amount, monthly_rent, contract_status, payment_status, notes,
        created_by_manager, date_created
    ) VALUES (
        p_branch_id, p_stall_id, p_stallholder_name, p_contact_number, p_email, p_address,
        p_business_name, p_business_type, p_contract_start_date, p_contract_end_date,
        p_lease_amount, p_monthly_rent, COALESCE(p_contract_status, 'Active'), 
        COALESCE(p_payment_status, 'Pending'), p_notes, p_manager_id, NOW()
    );
    
    SELECT LAST_INSERT_ID() as stallholder_id;
END//

-- =====================================================
-- SP: sp_getAvailableStallsForBranch
-- Purpose: Get available stalls for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAvailableStallsForBranch//
CREATE PROCEDURE sp_getAvailableStallsForBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT s.stall_id, s.stall_no, s.stall_location, s.size, s.rental_price,
           f.floor_name, sec.section_name
    FROM stall s
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE f.branch_id = p_branch_id 
    AND s.is_available = 1 
    AND s.status = 'Available'
    ORDER BY f.floor_number, sec.section_name, s.stall_no;
END//

-- =====================================================
-- SP: sp_getBranchInfo
-- Purpose: Get branch info by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchInfo//
CREATE PROCEDURE sp_getBranchInfo(
    IN p_branch_id INT
)
BEGIN
    SELECT b.branch_id, b.branch_name, b.area, b.location
    FROM branch b
    WHERE b.branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getStallholderCountByBranch
-- Purpose: Get stallholder counts by status for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderCountByBranch//
CREATE PROCEDURE sp_getStallholderCountByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        COUNT(*) as total_stallholders,
        SUM(CASE WHEN contract_status = 'Active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN contract_status = 'Expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN contract_status = 'Terminated' THEN 1 ELSE 0 END) as terminated_count
    FROM stallholder
    WHERE branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getFloorsWithSections
-- Purpose: Get floors with their sections for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getFloorsWithSections//
CREATE PROCEDURE sp_getFloorsWithSections(
    IN p_branch_id INT
)
BEGIN
    SELECT f.floor_id, f.floor_name, f.branch_id, s.section_id, s.section_name
    FROM floor f
    LEFT JOIN section s ON f.floor_id = s.floor_id AND s.status = 'Active'
    WHERE f.branch_id = p_branch_id AND f.status = 'Active'
    ORDER BY f.floor_number, s.section_name;
END//

-- =====================================================
-- SP: sp_getExistingStallNumbers
-- Purpose: Get existing stall numbers for validation
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getExistingStallNumbers//
CREATE PROCEDURE sp_getExistingStallNumbers(
    IN p_branch_id INT
)
BEGIN
    SELECT stall_no 
    FROM stall s 
    INNER JOIN floor f ON s.floor_id = f.floor_id 
    WHERE f.branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getExistingStallholders
-- Purpose: Get existing stallholders for validation
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getExistingStallholders//
CREATE PROCEDURE sp_getExistingStallholders(
    IN p_branch_id INT
)
BEGIN
    SELECT stallholder_name, email 
    FROM stallholder 
    WHERE branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getBranchNameById
-- Purpose: Get branch name by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchNameById//
CREATE PROCEDURE sp_getBranchNameById(
    IN p_branch_id INT
)
BEGIN
    SELECT branch_name 
    FROM branch 
    WHERE branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_updateStallForOccupancyWithDetails
-- Purpose: Update stall with full rental info
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateStallForOccupancyWithDetails//
CREATE PROCEDURE sp_updateStallForOccupancyWithDetails(
    IN p_stall_id INT,
    IN p_rental_price DECIMAL(10,2),
    IN p_base_rate DECIMAL(10,2),
    IN p_area_sqm DECIMAL(10,2),
    IN p_additional_charges DECIMAL(10,2)
)
BEGIN
    UPDATE stall SET 
        rental_price = p_rental_price,
        base_rate = p_base_rate,
        area_sqm = p_area_sqm,
        additional_charges = p_additional_charges,
        is_available = 0, 
        status = 'Occupied',
        updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_createFloorForImport
-- Purpose: Create floor during import
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createFloorForImport//
CREATE PROCEDURE sp_createFloorForImport(
    IN p_branch_id INT,
    IN p_floor_name VARCHAR(100)
)
BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number, status) 
    VALUES (p_branch_id, p_floor_name, 0, 'Active');
    
    SELECT LAST_INSERT_ID() as floor_id;
END//

-- =====================================================
-- SP: sp_createSectionForImport
-- Purpose: Create section during import
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createSectionForImport//
CREATE PROCEDURE sp_createSectionForImport(
    IN p_floor_id INT,
    IN p_section_name VARCHAR(100)
)
BEGIN
    INSERT INTO section (floor_id, section_name, status) 
    VALUES (p_floor_id, p_section_name, 'Active');
    
    SELECT LAST_INSERT_ID() as section_id;
END//

DELIMITER ;

-- Success message
SELECT 'Stallholder Controller stored procedures created successfully' as status;
