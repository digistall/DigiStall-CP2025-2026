-- ========================================
-- EMAIL-BASED LOGIN PROCEDURES
-- ========================================
-- All users login with EMAIL (encrypted) instead of username
-- Passwords are encrypted with AES-256-GCM, not hashed
-- ========================================

USE naga_stall;

DELIMITER $$

-- Get System Administrator by Email
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

-- Get Business Owner by Email
DROP PROCEDURE IF EXISTS getBusinessOwnerByEmail$$
CREATE PROCEDURE getBusinessOwnerByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        business_owner_id,
        email,
        owner_password,
        owner_full_name,
        first_name,
        last_name,
        contact_number,
        status,
        subscription_status,
        primary_manager_id
    FROM stall_business_owner
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Business Manager by Email
DROP PROCEDURE IF EXISTS getBusinessManagerByEmail$$
CREATE PROCEDURE getBusinessManagerByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        business_manager_id,
        email,
        manager_password,
        first_name,
        last_name,
        contact_number,
        status,
        business_owner_id,
        branch_id
    FROM business_manager
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Business Employee by Email
DROP PROCEDURE IF EXISTS getBusinessEmployeeByEmail$$
CREATE PROCEDURE getBusinessEmployeeByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        business_employee_id,
        email,
        employee_password,
        first_name,
        last_name,
        phone_number,
        status,
        business_manager_id,
        branch_id,
        permissions
    FROM business_employee
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Inspector by Email
DROP PROCEDURE IF EXISTS getInspectorByEmail$$
CREATE PROCEDURE getInspectorByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        inspector_id,
        email,
        password,
        first_name,
        last_name,
        contact_no,
        date_hired,
        status
    FROM inspector
    WHERE email = p_email
      AND status = 'active';
END$$

-- Get Collector by Email
DROP PROCEDURE IF EXISTS getCollectorByEmail$$
CREATE PROCEDURE getCollectorByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        collector_id,
        email,
        password,
        first_name,
        last_name,
        contact_no,
        date_hired,
        status
    FROM collector
    WHERE email = p_email
      AND status = 'active';
END$$

-- Get Stallholder by Email (for mobile login)
DROP PROCEDURE IF EXISTS getStallholderByEmail$$
CREATE PROCEDURE getStallholderByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        s.stallholder_id,
        s.mobile_user_id,
        s.email,
        s.first_name,
        s.last_name,
        s.contact_number,
        s.address,
        s.stall_id,
        s.branch_id,
        s.payment_status,
        s.status,
        m.password as stallholder_password
    FROM stallholder s
    LEFT JOIN mobile_user m ON s.mobile_user_id = m.mobile_user_id
    WHERE s.email = p_email
      AND s.status = 'active';
END$$

-- Get Branch by ID
DROP PROCEDURE IF EXISTS getBranchById$$
CREATE PROCEDURE getBranchById(IN p_branch_id INT)
BEGIN
    SELECT 
        branch_id,
        branch_name,
        area,
        location,
        address,
        contact_number,
        email,
        status,
        business_owner_id,
        business_manager_id
    FROM branch
    WHERE branch_id = p_branch_id;
END$$

DELIMITER ;

SELECT '✅ Email-based login procedures added!' AS status;
SELECT 'Users now login with email instead of username' AS info;
SELECT 'Passwords are encrypted with AES-256-GCM' AS note;
