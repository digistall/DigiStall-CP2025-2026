-- =============================================
-- 412: Additional Stall Operations Stored Procedures
-- Created: Auto-generated for 100% SP compliance
-- =============================================

DELIMITER $$

-- =============================================
-- Validate floor and section belong to branch
-- =============================================
DROP PROCEDURE IF EXISTS sp_validateFloorSectionBranch$$
CREATE PROCEDURE sp_validateFloorSectionBranch(
  IN p_branch_id INT,
  IN p_floor_id INT,
  IN p_section_id INT
)
BEGIN
  SELECT 
    s.section_id, 
    s.section_name, 
    f.floor_id, 
    f.floor_name 
  FROM section s
  INNER JOIN floor f ON s.floor_id = f.floor_id
  WHERE f.branch_id = p_branch_id 
    AND f.floor_id = p_floor_id 
    AND s.section_id = p_section_id;
END$$

-- =============================================
-- Check if stall number exists in section
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkStallExistsInSection$$
CREATE PROCEDURE sp_checkStallExistsInSection(
  IN p_stall_no VARCHAR(50),
  IN p_section_id INT
)
BEGIN
  SELECT 
    s.stall_id, 
    f.floor_name, 
    sec.section_name
  FROM stall s
  INNER JOIN section sec ON s.section_id = sec.section_id
  INNER JOIN floor f ON sec.floor_id = f.floor_id
  WHERE s.stall_no = p_stall_no 
    AND s.section_id = p_section_id;
END$$

-- =============================================
-- Insert stall with all fields
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStallFull$$
CREATE PROCEDURE sp_insertStallFull(
  IN p_stall_no VARCHAR(50),
  IN p_stall_location VARCHAR(255),
  IN p_size VARCHAR(50),
  IN p_area_sqm DECIMAL(10,2),
  IN p_floor_id INT,
  IN p_section_id INT,
  IN p_base_rate DECIMAL(10,2),
  IN p_rental_price DECIMAL(10,2),
  IN p_rate_per_sqm DECIMAL(10,2),
  IN p_price_type VARCHAR(50),
  IN p_status VARCHAR(50),
  IN p_stamp VARCHAR(50),
  IN p_description TEXT,
  IN p_stall_image TEXT,
  IN p_is_available TINYINT,
  IN p_raffle_auction_deadline DATETIME,
  IN p_deadline_active TINYINT,
  IN p_raffle_auction_status VARCHAR(50),
  IN p_created_by_manager INT
)
BEGIN
  INSERT INTO stall (
    stall_no, stall_location, size, area_sqm, floor_id, section_id, 
    base_rate, rental_price, rate_per_sqm, price_type, status, stamp, 
    description, stall_image, is_available, raffle_auction_deadline, 
    deadline_active, raffle_auction_status, created_by_business_manager, created_at
  ) VALUES (
    p_stall_no,
    p_stall_location,
    p_size,
    p_area_sqm,
    p_floor_id,
    p_section_id,
    p_base_rate,
    p_rental_price,
    p_rate_per_sqm,
    p_price_type,
    p_status,
    p_stamp,
    p_description,
    p_stall_image,
    p_is_available,
    p_raffle_auction_deadline,
    p_deadline_active,
    p_raffle_auction_status,
    p_created_by_manager,
    NOW()
  );
  SELECT LAST_INSERT_ID() as stall_id;
END$$

-- =============================================
-- Insert stall image with blob
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStallImageBlob$$
CREATE PROCEDURE sp_insertStallImageBlob(
  IN p_stall_id INT,
  IN p_image_url TEXT,
  IN p_image_data LONGBLOB,
  IN p_mime_type VARCHAR(100),
  IN p_file_name VARCHAR(255),
  IN p_display_order INT,
  IN p_is_primary TINYINT
)
BEGIN
  INSERT INTO stall_images (
    stall_id, 
    image_url, 
    image_data, 
    mime_type, 
    file_name, 
    display_order, 
    is_primary, 
    created_at
  ) VALUES (
    p_stall_id, 
    p_image_url, 
    p_image_data, 
    p_mime_type, 
    p_file_name, 
    p_display_order, 
    p_is_primary, 
    NOW()
  );
  SELECT LAST_INSERT_ID() as image_id;
END$$

-- =============================================
-- Insert raffle record
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertRaffleRecord$$
CREATE PROCEDURE sp_insertRaffleRecord(
  IN p_stall_id INT,
  IN p_created_by_manager INT
)
BEGIN
  INSERT INTO raffle (
    stall_id, 
    raffle_status, 
    created_by_manager, 
    created_at
  ) VALUES (
    p_stall_id, 
    'Waiting for Participants', 
    p_created_by_manager, 
    NOW()
  );
  SELECT LAST_INSERT_ID() as raffle_id;
END$$

-- =============================================
-- Insert auction record
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertAuctionRecord$$
CREATE PROCEDURE sp_insertAuctionRecord(
  IN p_stall_id INT,
  IN p_starting_price DECIMAL(10,2),
  IN p_created_by_manager INT
)
BEGIN
  INSERT INTO auction (
    stall_id, 
    starting_price,
    current_bid,
    auction_status, 
    created_by_manager, 
    created_at
  ) VALUES (
    p_stall_id, 
    p_starting_price,
    p_starting_price,
    'Waiting for Participants', 
    p_created_by_manager, 
    NOW()
  );
  SELECT LAST_INSERT_ID() as auction_id;
END$$

-- =============================================
-- Get stall stallholder info for notification
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallholderInfoForStall$$
CREATE PROCEDURE sp_getStallholderInfoForStall(
  IN p_stall_id INT
)
BEGIN
  SELECT 
    sh.stallholder_name, 
    sh.email,
    sh.contact_number,
    sh.stallholder_id
  FROM stallholder sh
  WHERE sh.stall_id = p_stall_id 
    AND sh.status = 'active';
END$$

-- =============================================
-- Get branches by business manager
-- =============================================
DROP PROCEDURE IF EXISTS sp_getBranchesByManager$$
CREATE PROCEDURE sp_getBranchesByManager(
  IN p_business_manager_id INT
)
BEGIN
  SELECT 
    b.branch_id, 
    b.branch_name,
    b.area,
    b.location
  FROM branch b
  INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
  WHERE bm.business_manager_id = p_business_manager_id;
END$$

-- =============================================
-- Get floor by ID with branch info
-- =============================================
DROP PROCEDURE IF EXISTS sp_getFloorById$$
CREATE PROCEDURE sp_getFloorById(
  IN p_floor_id INT
)
BEGIN
  SELECT 
    f.floor_id,
    f.floor_name,
    f.branch_id,
    b.branch_name,
    b.area
  FROM floor f
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE f.floor_id = p_floor_id;
END$$

-- =============================================
-- Get section by ID with floor info
-- =============================================
DROP PROCEDURE IF EXISTS sp_getSectionById$$
CREATE PROCEDURE sp_getSectionById(
  IN p_section_id INT
)
BEGIN
  SELECT 
    s.section_id,
    s.section_name,
    s.floor_id,
    f.floor_name,
    f.branch_id
  FROM section s
  LEFT JOIN floor f ON s.floor_id = f.floor_id
  WHERE s.section_id = p_section_id;
END$$

-- =============================================
-- Get stalls by section with pagination
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallsBySectionPaginated$$
CREATE PROCEDURE sp_getStallsBySectionPaginated(
  IN p_section_id INT,
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT 
    s.stall_id,
    s.stall_no,
    s.size,
    s.rental_price,
    s.stall_location,
    s.is_available,
    s.status,
    s.price_type
  FROM stall s
  WHERE s.section_id = p_section_id
  ORDER BY s.stall_no
  LIMIT p_limit OFFSET p_offset;
END$$

-- =============================================
-- Count stalls in section
-- =============================================
DROP PROCEDURE IF EXISTS sp_countStallsInSection$$
CREATE PROCEDURE sp_countStallsInSection(
  IN p_section_id INT
)
BEGIN
  SELECT COUNT(*) as total
  FROM stall
  WHERE section_id = p_section_id;
END$$

-- =============================================
-- Update stall rental price
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallRentalPrice$$
CREATE PROCEDURE sp_updateStallRentalPrice(
  IN p_stall_id INT,
  IN p_rental_price DECIMAL(10,2),
  IN p_base_rate DECIMAL(10,2),
  IN p_rate_per_sqm DECIMAL(10,2)
)
BEGIN
  UPDATE stall 
  SET 
    rental_price = p_rental_price,
    base_rate = p_base_rate,
    rate_per_sqm = p_rate_per_sqm
  WHERE stall_id = p_stall_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- Success message
SELECT 'Additional Stall Operations stored procedures created successfully' as status;
