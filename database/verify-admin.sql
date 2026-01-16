-- ============================================
-- VERIFY ADMIN DATA AND PROCEDURES
-- Run this in MySQL Workbench to check setup
-- ============================================

USE naga_stall;

-- 1. Check if admin data exists
SELECT '=== STEP 1: Check system_administrator table ===' AS step;
SELECT * FROM system_administrator;

-- 2. Check if procedure exists
SELECT '=== STEP 2: Check if getSystemAdminByEmail procedure exists ===' AS step;
SHOW PROCEDURE STATUS WHERE Db = 'naga_stall' AND Name LIKE '%Email%';

-- 3. Test the procedure directly
SELECT '=== STEP 3: Test getSystemAdminByEmail procedure ===' AS step;
CALL getSystemAdminByEmail('admin@digistall.com');

-- 4. If procedure doesn't exist, create it:
-- ============================================
-- UNCOMMENT AND RUN THIS IF PROCEDURE MISSING
-- ============================================
/*
DELIMITER $$

DROP PROCEDURE IF EXISTS getSystemAdminByEmail$$
CREATE PROCEDURE getSystemAdminByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        system_admin_id,
        email,
        admin_password,
        first_name,
        last_name,
        status
    FROM system_administrator
    WHERE email = p_email
      AND status = 'Active';
END$$

DELIMITER ;
*/
