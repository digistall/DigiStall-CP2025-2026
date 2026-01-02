-- =============================================
-- GET FLOORS AND SECTIONS STORED PROCEDURES
-- Migration: 325_sp_getFloorsSections.sql
-- Purpose: Convert raw SQL queries in getFloors.js and getSections.js to stored procedures
-- =============================================

DELIMITER //

-- =============================================
-- GET ALL FLOORS (for system admin)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllFloorsAdmin//
CREATE PROCEDURE sp_getAllFloorsAdmin()
BEGIN
    SELECT f.* FROM floor f;
END//

-- =============================================
-- GET FLOORS BY SINGLE BRANCH
-- =============================================
DROP PROCEDURE IF EXISTS sp_getFloorsByBranch//
CREATE PROCEDURE sp_getFloorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT f.* FROM floor f WHERE f.branch_id = p_branch_id;
END//

-- =============================================
-- GET FLOORS BY MULTIPLE BRANCHES
-- =============================================
DROP PROCEDURE IF EXISTS sp_getFloorsByBranches//
CREATE PROCEDURE sp_getFloorsByBranches(
    IN p_branch_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('SELECT f.* FROM floor f WHERE f.branch_id IN (', p_branch_ids, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =============================================
-- GET ALL SECTIONS (for system admin)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllSectionsAdmin//
CREATE PROCEDURE sp_getAllSectionsAdmin()
BEGIN
    SELECT s.* FROM section s;
END//

-- =============================================
-- GET SECTIONS BY SINGLE BRANCH
-- =============================================
DROP PROCEDURE IF EXISTS sp_getSectionsByBranch//
CREATE PROCEDURE sp_getSectionsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT s.* 
    FROM section s
    INNER JOIN floor f ON s.floor_id = f.floor_id
    WHERE f.branch_id = p_branch_id;
END//

-- =============================================
-- GET SECTIONS BY MULTIPLE BRANCHES
-- =============================================
DROP PROCEDURE IF EXISTS sp_getSectionsByBranches//
CREATE PROCEDURE sp_getSectionsByBranches(
    IN p_branch_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('SELECT s.* FROM section s INNER JOIN floor f ON s.floor_id = f.floor_id WHERE f.branch_id IN (', p_branch_ids, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

DELIMITER ;
