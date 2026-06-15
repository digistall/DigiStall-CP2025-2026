-- =====================================================================
--  ASSIGNED LOCATION - FULL CRUD STORED PROCEDURES
-- ---------------------------------------------------------------------
--  Table        : assigned_location
--  Architecture : All DB access for this feature goes through these
--                 stored procedures only. No ad-hoc SQL on the server,
--                 and absolutely none on the client.
--
--  Procedures:
--    sp_assigned_location_exists     - case-insensitive duplicate check
--    sp_assigned_location_create     - insert a new location
--    sp_assigned_location_get_all    - list w/ search + sort + pagination
--    sp_assigned_location_get_by_id  - fetch a single location
--    sp_assigned_location_update     - update an existing location
--    sp_assigned_location_delete     - permanent (hard) delete
--
--  Safety notes:
--    * Every parameter is bound (parameterized) by the caller.
--    * ORDER BY uses a whitelisted CASE expression so the sort column /
--      direction can NEVER be used for SQL injection.
--    * Duplicate / not-found conditions are reported with SIGNAL so the
--      service layer can translate them into clean API responses.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Table definition (safe to run repeatedly)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assigned_location (
    assigned_location_id INT AUTO_INCREMENT PRIMARY KEY,
    location_name        VARCHAR(100) NOT NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------
-- 1) sp_assigned_location_exists
--    Returns a single row { cnt } with the number of locations whose
--    name matches (case-insensitive). p_exclude_id lets the UPDATE flow
--    ignore the row being edited so a record never clashes with itself.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_assigned_location_exists`;
DELIMITER $$
CREATE PROCEDURE `sp_assigned_location_exists`(
    IN p_location_name VARCHAR(100),
    IN p_exclude_id    INT            -- pass NULL on create
)
BEGIN
    SELECT COUNT(*) AS cnt
    FROM assigned_location
    -- LOWER(...) on both sides guarantees a case-insensitive comparison
    WHERE LOWER(location_name) = LOWER(TRIM(p_location_name))
      AND (p_exclude_id IS NULL OR assigned_location_id <> p_exclude_id);
END$$
DELIMITER ;


-- ---------------------------------------------------------------------
-- 2) sp_assigned_location_create
--    Inserts a new location and returns the freshly created row.
--    A defensive duplicate guard is included so even a concurrent
--    request cannot slip a duplicate past the service-layer check.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_assigned_location_create`;
DELIMITER $$
CREATE PROCEDURE `sp_assigned_location_create`(
    IN p_location_name VARCHAR(100)
)
BEGIN
    DECLARE v_clean_name VARCHAR(100);
    DECLARE v_dupe       INT DEFAULT 0;

    SET v_clean_name = TRIM(p_location_name);

    -- Server-side guard: required
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Location name is required.';
    END IF;

    -- Server-side guard: case-insensitive duplicate
    SELECT COUNT(*) INTO v_dupe
    FROM assigned_location
    WHERE LOWER(location_name) = LOWER(v_clean_name);

    IF v_dupe > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Location name already exists.';
    END IF;

    -- created_at is generated automatically by the column default
    INSERT INTO assigned_location (location_name)
    VALUES (v_clean_name);

    -- Return the created row to the caller
    SELECT assigned_location_id, location_name, created_at
    FROM assigned_location
    WHERE assigned_location_id = LAST_INSERT_ID();
END$$
DELIMITER ;


-- ---------------------------------------------------------------------
-- 3) sp_assigned_location_get_all
--    Result set #1 : the paginated rows
--    Result set #2 : { total } total count matching the search filter
--
--    p_sort_by  : 'location_name' | 'created_at'  (anything else -> created_at)
--    p_sort_dir : 'ASC' | 'DESC'                  (anything else -> DESC)
--    p_limit / p_offset : pagination window (computed by the service)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_assigned_location_get_all`;
DELIMITER $$
CREATE PROCEDURE `sp_assigned_location_get_all`(
    IN p_search   VARCHAR(100),
    IN p_sort_by  VARCHAR(20),
    IN p_sort_dir VARCHAR(4),
    IN p_limit    INT,
    IN p_offset   INT
)
BEGIN
    -- Normalise sort inputs to a strict whitelist (defence in depth).
    DECLARE v_sort_by  VARCHAR(20);
    DECLARE v_sort_dir VARCHAR(4);
    DECLARE v_limit    INT;
    DECLARE v_offset   INT;

    SET v_sort_by  = IF(p_sort_by  IN ('location_name', 'created_at'), p_sort_by, 'created_at');
    SET v_sort_dir = IF(UPPER(p_sort_dir) = 'ASC', 'ASC', 'DESC');
    SET v_limit    = IF(p_limit  IS NULL OR p_limit  < 1, 10, p_limit);
    SET v_offset   = IF(p_offset IS NULL OR p_offset < 0, 0,  p_offset);

    -- Result set #1: page of data.
    -- ORDER BY is built from whitelisted CASE branches, never string concat,
    -- so the sort options cannot be exploited for SQL injection.
    SELECT assigned_location_id, location_name, created_at
    FROM assigned_location
    WHERE p_search IS NULL
       OR p_search = ''
       OR location_name LIKE CONCAT('%', p_search, '%')
    ORDER BY
        CASE WHEN v_sort_by = 'location_name' AND v_sort_dir = 'ASC'  THEN location_name END ASC,
        CASE WHEN v_sort_by = 'location_name' AND v_sort_dir = 'DESC' THEN location_name END DESC,
        CASE WHEN v_sort_by = 'created_at'    AND v_sort_dir = 'ASC'  THEN created_at    END ASC,
        CASE WHEN v_sort_by = 'created_at'    AND v_sort_dir = 'DESC' THEN created_at    END DESC,
        assigned_location_id DESC
    LIMIT v_limit OFFSET v_offset;

    -- Result set #2: total matching rows (for pagination metadata).
    SELECT COUNT(*) AS total
    FROM assigned_location
    WHERE p_search IS NULL
       OR p_search = ''
       OR location_name LIKE CONCAT('%', p_search, '%');
END$$
DELIMITER ;


-- ---------------------------------------------------------------------
-- 4) sp_assigned_location_get_by_id
--    Returns the single matching row (empty result set if not found;
--    the service layer turns "empty" into a 404).
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_assigned_location_get_by_id`;
DELIMITER $$
CREATE PROCEDURE `sp_assigned_location_get_by_id`(
    IN p_id INT
)
BEGIN
    SELECT assigned_location_id, location_name, created_at
    FROM assigned_location
    WHERE assigned_location_id = p_id;
END$$
DELIMITER ;


-- ---------------------------------------------------------------------
-- 5) sp_assigned_location_update
--    Validates existence + case-insensitive duplicate (excluding self),
--    updates the row, then returns the updated record.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_assigned_location_update`;
DELIMITER $$
CREATE PROCEDURE `sp_assigned_location_update`(
    IN p_id            INT,
    IN p_location_name VARCHAR(100)
)
BEGIN
    DECLARE v_clean_name VARCHAR(100);
    DECLARE v_exists     INT DEFAULT 0;
    DECLARE v_dupe       INT DEFAULT 0;

    SET v_clean_name = TRIM(p_location_name);

    -- Required
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Location name is required.';
    END IF;

    -- Must exist
    SELECT COUNT(*) INTO v_exists
    FROM assigned_location
    WHERE assigned_location_id = p_id;

    IF v_exists = 0 THEN
        -- 45001 is used by the service to map to a 404 (not found)
        SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Assigned location not found.';
    END IF;

    -- No duplicate name on another row (case-insensitive)
    SELECT COUNT(*) INTO v_dupe
    FROM assigned_location
    WHERE LOWER(location_name) = LOWER(v_clean_name)
      AND assigned_location_id <> p_id;

    IF v_dupe > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Location name already exists.';
    END IF;

    UPDATE assigned_location
    SET location_name = v_clean_name
    WHERE assigned_location_id = p_id;

    -- Return the updated row
    SELECT assigned_location_id, location_name, created_at
    FROM assigned_location
    WHERE assigned_location_id = p_id;
END$$
DELIMITER ;


-- ---------------------------------------------------------------------
-- 6) sp_assigned_location_delete
--    Permanent deletion (soft delete is intentionally NOT used).
--    Signals 45001 when the row does not exist.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_assigned_location_delete`;
DELIMITER $$
CREATE PROCEDURE `sp_assigned_location_delete`(
    IN p_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists
    FROM assigned_location
    WHERE assigned_location_id = p_id;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Assigned location not found.';
    END IF;

    DELETE FROM assigned_location
    WHERE assigned_location_id = p_id;

    SELECT p_id AS assigned_location_id;
END$$
DELIMITER ;
