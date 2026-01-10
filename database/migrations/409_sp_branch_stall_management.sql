-- =============================================
-- 409: Branch and Stall Management Stored Procedures
-- Created: Auto-generated for 100% SP compliance
-- =============================================

DELIMITER $$

-- =============================================
-- Get business manager info with branch
-- =============================================
DROP PROCEDURE IF EXISTS sp_getBusinessManagerWithBranch$$
CREATE PROCEDURE sp_getBusinessManagerWithBranch(
  IN p_business_manager_id INT
)
BEGIN
  SELECT 
    bm.branch_id, 
    b.branch_name, 
    b.area, 
    bm.business_manager_id
  FROM business_manager bm
  INNER JOIN branch b ON bm.branch_id = b.branch_id
  WHERE bm.business_manager_id = p_business_manager_id;
END$$

-- =============================================
-- Get employee with branch info
-- =============================================
DROP PROCEDURE IF EXISTS sp_getEmployeeWithBranchInfo$$
CREATE PROCEDURE sp_getEmployeeWithBranchInfo(
  IN p_employee_id INT
)
BEGIN
  SELECT 
    e.branch_id, 
    e.employee_id, 
    e.first_name, 
    e.last_name
  FROM employee e 
  WHERE e.employee_id = p_employee_id;
END$$

-- =============================================
-- Get branch info with optional manager
-- =============================================
DROP PROCEDURE IF EXISTS sp_getBranchInfoWithManager$$
CREATE PROCEDURE sp_getBranchInfoWithManager(
  IN p_branch_id INT
)
BEGIN
  SELECT 
    b.branch_id, 
    b.branch_name, 
    b.area, 
    bm.business_manager_id
  FROM branch b
  LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
  WHERE b.branch_id = p_branch_id;
END$$

-- =============================================
-- Get floor by branch ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getFloorByBranchId$$
CREATE PROCEDURE sp_getFloorByBranchId(
  IN p_branch_id INT
)
BEGIN
  SELECT floor_id 
  FROM floor 
  WHERE branch_id = p_branch_id 
  ORDER BY floor_id 
  LIMIT 1;
END$$

-- =============================================
-- Get section by floor ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getSectionByFloorId$$
CREATE PROCEDURE sp_getSectionByFloorId(
  IN p_floor_id INT
)
BEGIN
  SELECT section_id 
  FROM section 
  WHERE floor_id = p_floor_id 
  ORDER BY section_id 
  LIMIT 1;
END$$

-- =============================================
-- Insert section
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertSection$$
CREATE PROCEDURE sp_insertSection(
  IN p_floor_id INT,
  IN p_section_name VARCHAR(50)
)
BEGIN
  INSERT INTO section (floor_id, section_name)
  VALUES (p_floor_id, p_section_name);
  SELECT LAST_INSERT_ID() as section_id;
END$$

-- =============================================
-- Insert floor
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertFloor$$
CREATE PROCEDURE sp_insertFloor(
  IN p_branch_id INT,
  IN p_floor_name VARCHAR(50)
)
BEGIN
  INSERT INTO floor (branch_id, floor_name)
  VALUES (p_branch_id, p_floor_name);
  SELECT LAST_INSERT_ID() as floor_id;
END$$

-- =============================================
-- Check stall number exists
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkStallNumberExists$$
CREATE PROCEDURE sp_checkStallNumberExists(
  IN p_stall_no VARCHAR(50),
  IN p_section_id INT
)
BEGIN
  SELECT stall_id 
  FROM stall 
  WHERE stall_no = p_stall_no 
    AND section_id = p_section_id;
END$$

-- =============================================
-- Insert new stall
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStall$$
CREATE PROCEDURE sp_insertStall(
  IN p_stall_no VARCHAR(50),
  IN p_size VARCHAR(50),
  IN p_rental_price DECIMAL(10,2),
  IN p_stall_location VARCHAR(255),
  IN p_stall_image TEXT,
  IN p_description TEXT,
  IN p_section_id INT,
  IN p_business_owner_id INT,
  IN p_is_available BOOLEAN,
  IN p_status VARCHAR(50),
  IN p_price_type VARCHAR(50),
  IN p_deadline DATETIME,
  IN p_base_rate DECIMAL(10,2),
  IN p_area_sqm DECIMAL(10,2),
  IN p_rate_per_sqm DECIMAL(10,2)
)
BEGIN
  INSERT INTO stall (
    stall_no,
    size,
    rental_price,
    stall_location,
    stall_image,
    description,
    section_id,
    business_owner_id,
    is_available,
    status,
    price_type,
    deadline,
    base_rate,
    area_sqm,
    rate_per_sqm
  ) VALUES (
    p_stall_no,
    p_size,
    p_rental_price,
    p_stall_location,
    p_stall_image,
    p_description,
    p_section_id,
    p_business_owner_id,
    p_is_available,
    COALESCE(p_status, 'Available'),
    COALESCE(p_price_type, 'Fixed Price'),
    p_deadline,
    p_base_rate,
    p_area_sqm,
    p_rate_per_sqm
  );
  SELECT LAST_INSERT_ID() as stall_id;
END$$

-- =============================================
-- Insert raffle for stall
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertRaffleForStall$$
CREATE PROCEDURE sp_insertRaffleForStall(
  IN p_stall_id INT,
  IN p_deadline DATETIME
)
BEGIN
  INSERT INTO raffle (stall_id, raffle_deadline, status, raffle_start)
  VALUES (p_stall_id, p_deadline, 'open', NOW());
  SELECT LAST_INSERT_ID() as raffle_id;
END$$

-- =============================================
-- Insert auction for stall
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertAuctionForStall$$
CREATE PROCEDURE sp_insertAuctionForStall(
  IN p_stall_id INT,
  IN p_deadline DATETIME,
  IN p_starting_price DECIMAL(10,2)
)
BEGIN
  INSERT INTO auction (stall_id, auction_deadline, status, auction_start, starting_price, current_bid)
  VALUES (p_stall_id, p_deadline, 'open', NOW(), p_starting_price, p_starting_price);
  SELECT LAST_INSERT_ID() as auction_id;
END$$

-- =============================================
-- Get stall with full details
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallFullDetails$$
CREATE PROCEDURE sp_getStallFullDetails(
  IN p_stall_id INT
)
BEGIN
  SELECT 
    s.stall_id,
    s.stall_no,
    s.size,
    s.rental_price,
    s.stall_location,
    s.stall_image,
    s.description,
    s.is_available,
    s.status,
    s.price_type,
    s.deadline,
    s.base_rate,
    s.area_sqm,
    s.rate_per_sqm,
    s.section_id,
    sec.section_name,
    f.floor_id,
    f.floor_name,
    b.branch_id,
    b.branch_name,
    b.area
  FROM stall s
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE s.stall_id = p_stall_id;
END$$

-- =============================================
-- Update stall
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStall$$
CREATE PROCEDURE sp_updateStall(
  IN p_stall_id INT,
  IN p_stall_no VARCHAR(50),
  IN p_size VARCHAR(50),
  IN p_rental_price DECIMAL(10,2),
  IN p_stall_location VARCHAR(255),
  IN p_stall_image TEXT,
  IN p_description TEXT,
  IN p_section_id INT,
  IN p_is_available BOOLEAN,
  IN p_status VARCHAR(50),
  IN p_price_type VARCHAR(50),
  IN p_deadline DATETIME,
  IN p_base_rate DECIMAL(10,2),
  IN p_area_sqm DECIMAL(10,2),
  IN p_rate_per_sqm DECIMAL(10,2)
)
BEGIN
  UPDATE stall 
  SET 
    stall_no = COALESCE(p_stall_no, stall_no),
    size = COALESCE(p_size, size),
    rental_price = COALESCE(p_rental_price, rental_price),
    stall_location = COALESCE(p_stall_location, stall_location),
    stall_image = COALESCE(p_stall_image, stall_image),
    description = COALESCE(p_description, description),
    section_id = COALESCE(p_section_id, section_id),
    is_available = COALESCE(p_is_available, is_available),
    status = COALESCE(p_status, status),
    price_type = COALESCE(p_price_type, price_type),
    deadline = COALESCE(p_deadline, deadline),
    base_rate = COALESCE(p_base_rate, base_rate),
    area_sqm = COALESCE(p_area_sqm, area_sqm),
    rate_per_sqm = COALESCE(p_rate_per_sqm, rate_per_sqm)
  WHERE stall_id = p_stall_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Delete stall
-- =============================================
DROP PROCEDURE IF EXISTS sp_deleteStall$$
CREATE PROCEDURE sp_deleteStall(
  IN p_stall_id INT
)
BEGIN
  DELETE FROM stall WHERE stall_id = p_stall_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get all stalls by branch
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallsByBranch$$
CREATE PROCEDURE sp_getStallsByBranch(
  IN p_branch_id INT
)
BEGIN
  SELECT 
    s.stall_id,
    s.stall_no,
    s.size,
    s.rental_price,
    s.stall_location,
    s.stall_image,
    s.description,
    s.is_available,
    s.status,
    s.price_type,
    s.deadline,
    s.base_rate,
    s.area_sqm,
    s.rate_per_sqm,
    sec.section_name,
    f.floor_name,
    b.branch_name,
    b.area
  FROM stall s
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE b.branch_id = p_branch_id
  ORDER BY s.stall_no;
END$$

-- =============================================
-- Get available stalls
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAvailableStalls$$
CREATE PROCEDURE sp_getAvailableStalls()
BEGIN
  SELECT 
    s.stall_id,
    s.stall_no,
    s.size,
    s.rental_price,
    s.stall_location,
    s.description,
    s.price_type,
    sec.section_name,
    f.floor_name,
    b.branch_name,
    b.area
  FROM stall s
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE s.is_available = TRUE 
    AND s.status = 'Available'
  ORDER BY b.branch_name, s.stall_no;
END$$

-- =============================================
-- Get floor and section details
-- =============================================
DROP PROCEDURE IF EXISTS sp_getFloorSectionDetails$$
CREATE PROCEDURE sp_getFloorSectionDetails(
  IN p_section_id INT
)
BEGIN
  SELECT 
    s.section_id,
    s.section_name,
    s.floor_id,
    f.floor_name,
    f.branch_id,
    b.branch_name,
    b.area
  FROM section s
  LEFT JOIN floor f ON s.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE s.section_id = p_section_id;
END$$

-- =============================================
-- Get sections by floor
-- =============================================
DROP PROCEDURE IF EXISTS sp_getSectionsByFloor$$
CREATE PROCEDURE sp_getSectionsByFloor(
  IN p_floor_id INT
)
BEGIN
  SELECT section_id, section_name, floor_id
  FROM section
  WHERE floor_id = p_floor_id
  ORDER BY section_name;
END$$

-- =============================================
-- Get floors by branch
-- =============================================
DROP PROCEDURE IF EXISTS sp_getFloorsByBranch$$
CREATE PROCEDURE sp_getFloorsByBranch(
  IN p_branch_id INT
)
BEGIN
  SELECT floor_id, floor_name, branch_id
  FROM floor
  WHERE branch_id = p_branch_id
  ORDER BY floor_name;
END$$

-- =============================================
-- Get all branches
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllBranches$$
CREATE PROCEDURE sp_getAllBranches()
BEGIN
  SELECT 
    branch_id,
    branch_name,
    area,
    location
  FROM branch
  ORDER BY branch_name;
END$$

-- =============================================
-- Get distinct areas from branch
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDistinctAreas$$
CREATE PROCEDURE sp_getDistinctAreas()
BEGIN
  SELECT DISTINCT area 
  FROM branch 
  WHERE area IS NOT NULL 
  ORDER BY area;
END$$

DELIMITER ;

-- Success message
SELECT 'Branch and Stall Management stored procedures created successfully' as status;
