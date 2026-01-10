-- =============================================
-- 410: Auth and Application Management Stored Procedures
-- Created: Auto-generated for 100% SP compliance
-- =============================================

DELIMITER $$

-- =============================================
-- Get admin by ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAdminById$$
CREATE PROCEDURE sp_getAdminById(
  IN p_admin_id INT
)
BEGIN
  SELECT admin_id, admin_name, admin_email, admin_password, role
  FROM admin
  WHERE admin_id = p_admin_id;
END$$

-- =============================================
-- Get admin by email
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAdminByEmail$$
CREATE PROCEDURE sp_getAdminByEmail(
  IN p_email VARCHAR(255)
)
BEGIN
  SELECT admin_id, admin_name, admin_email, admin_password, role
  FROM admin
  WHERE admin_email = p_email;
END$$

-- =============================================
-- Update last login for dynamic table
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateUserLastLogin$$
CREATE PROCEDURE sp_updateUserLastLogin(
  IN p_table_name VARCHAR(50),
  IN p_id_column VARCHAR(50),
  IN p_user_id INT
)
BEGIN
  SET @sql = CONCAT('UPDATE ', p_table_name, ' SET last_login = NOW() WHERE ', p_id_column, ' = ?');
  PREPARE stmt FROM @sql;
  SET @user_id = p_user_id;
  EXECUTE stmt USING @user_id;
  DEALLOCATE PREPARE stmt;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get business manager by email
-- =============================================
DROP PROCEDURE IF EXISTS sp_getBusinessManagerByEmail$$
CREATE PROCEDURE sp_getBusinessManagerByEmail(
  IN p_email VARCHAR(255)
)
BEGIN
  SELECT 
    bm.*,
    b.branch_name,
    b.area as branch_area
  FROM business_manager bm
  LEFT JOIN branch b ON bm.branch_id = b.branch_id
  WHERE bm.email = p_email;
END$$

-- =============================================
-- Get employee by email
-- =============================================
DROP PROCEDURE IF EXISTS sp_getEmployeeByEmail$$
CREATE PROCEDURE sp_getEmployeeByEmail(
  IN p_email VARCHAR(255)
)
BEGIN
  SELECT 
    e.*,
    b.branch_name,
    b.area as branch_area
  FROM employee e
  LEFT JOIN branch b ON e.branch_id = b.branch_id
  WHERE e.email = p_email;
END$$

-- =============================================
-- Get application with full details
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicationFullDetails$$
CREATE PROCEDURE sp_getApplicationFullDetails(
  IN p_application_id INT
)
BEGIN
  SELECT 
    a.*,
    ap.applicant_full_name,
    ap.applicant_contact_number,
    ap.applicant_email,
    ap.applicant_address,
    s.stall_no,
    s.stall_location,
    s.size,
    s.rental_price,
    s.price_type,
    b.branch_name,
    b.area
  FROM application a
  LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
  LEFT JOIN stall s ON a.stall_id = s.stall_id
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE a.application_id = p_application_id;
END$$

-- =============================================
-- Update application status
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateApplicationStatus$$
CREATE PROCEDURE sp_updateApplicationStatus(
  IN p_application_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  UPDATE application 
  SET application_status = p_status
  WHERE application_id = p_application_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get applications by status
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicationsByStatus$$
CREATE PROCEDURE sp_getApplicationsByStatus(
  IN p_status VARCHAR(50),
  IN p_branch_id INT
)
BEGIN
  IF p_branch_id IS NULL OR p_branch_id = 0 THEN
    SELECT 
      a.*,
      ap.applicant_full_name,
      s.stall_no,
      b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.application_status = p_status
    ORDER BY a.created_at DESC;
  ELSE
    SELECT 
      a.*,
      ap.applicant_full_name,
      s.stall_no,
      b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.application_status = p_status
      AND b.branch_id = p_branch_id
    ORDER BY a.created_at DESC;
  END IF;
END$$

-- =============================================
-- Get stall availability status
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallAvailabilityStatus$$
CREATE PROCEDURE sp_getStallAvailabilityStatus(
  IN p_stall_id INT
)
BEGIN
  SELECT stall_id, is_available, status
  FROM stall
  WHERE stall_id = p_stall_id;
END$$

-- =============================================
-- Update stall status
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallStatus$$
CREATE PROCEDURE sp_updateStallStatus(
  IN p_stall_id INT,
  IN p_status VARCHAR(50),
  IN p_is_available BOOLEAN
)
BEGIN
  UPDATE stall 
  SET 
    status = p_status,
    is_available = p_is_available
  WHERE stall_id = p_stall_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get business owner by stall
-- =============================================
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByStall$$
CREATE PROCEDURE sp_getBusinessOwnerByStall(
  IN p_stall_id INT
)
BEGIN
  SELECT b.business_owner_id 
  FROM stall s
  INNER JOIN section sec ON s.section_id = sec.section_id
  INNER JOIN floor f ON sec.floor_id = f.floor_id
  INNER JOIN branch br ON f.branch_id = br.branch_id
  LEFT JOIN business_owner b ON br.business_owner_id = b.business_owner_id
  WHERE s.stall_id = p_stall_id;
END$$

-- =============================================
-- Insert credential
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertCredential$$
CREATE PROCEDURE sp_insertCredential(
  IN p_registrationid VARCHAR(100),
  IN p_user_name VARCHAR(100),
  IN p_password VARCHAR(255),
  IN p_applicant_id INT
)
BEGIN
  INSERT INTO credential (registrationid, user_name, password, applicant_id)
  VALUES (p_registrationid, p_user_name, p_password, p_applicant_id);
  SELECT LAST_INSERT_ID() as credential_id;
END$$

-- =============================================
-- Update credential password
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateCredentialPassword$$
CREATE PROCEDURE sp_updateCredentialPassword(
  IN p_applicant_id INT,
  IN p_password VARCHAR(255)
)
BEGIN
  UPDATE credential 
  SET password = p_password
  WHERE applicant_id = p_applicant_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Insert stallholder from approved application
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStallholderFromApplication$$
CREATE PROCEDURE sp_insertStallholderFromApplication(
  IN p_applicant_id INT,
  IN p_stallholder_name VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_contact_number VARCHAR(50),
  IN p_address TEXT,
  IN p_stall_id INT,
  IN p_branch_id INT,
  IN p_business_name VARCHAR(255),
  IN p_business_type VARCHAR(100),
  IN p_monthly_rent DECIMAL(10,2),
  IN p_contract_start_date DATE,
  IN p_contract_end_date DATE
)
BEGIN
  INSERT INTO stallholder (
    applicant_id,
    stallholder_name,
    email,
    contact_number,
    address,
    stall_id,
    branch_id,
    business_name,
    business_type,
    monthly_rent,
    contract_start_date,
    contract_end_date,
    status,
    payment_status,
    created_at
  ) VALUES (
    p_applicant_id,
    p_stallholder_name,
    p_email,
    p_contact_number,
    p_address,
    p_stall_id,
    p_branch_id,
    p_business_name,
    p_business_type,
    p_monthly_rent,
    COALESCE(p_contract_start_date, CURDATE()),
    COALESCE(p_contract_end_date, DATE_ADD(CURDATE(), INTERVAL 1 YEAR)),
    'active',
    'pending',
    NOW()
  );
  SELECT LAST_INSERT_ID() as stallholder_id;
END$$

-- =============================================
-- Update stallholder info
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallholderInfo$$
CREATE PROCEDURE sp_updateStallholderInfo(
  IN p_stallholder_id INT,
  IN p_stallholder_name VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_contact_number VARCHAR(50),
  IN p_address TEXT,
  IN p_business_name VARCHAR(255),
  IN p_business_type VARCHAR(100)
)
BEGIN
  UPDATE stallholder 
  SET 
    stallholder_name = COALESCE(p_stallholder_name, stallholder_name),
    email = COALESCE(p_email, email),
    contact_number = COALESCE(p_contact_number, contact_number),
    address = COALESCE(p_address, address),
    business_name = COALESCE(p_business_name, business_name),
    business_type = COALESCE(p_business_type, business_type)
  WHERE stallholder_id = p_stallholder_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Insert branch manager
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertBranchManager$$
CREATE PROCEDURE sp_insertBranchManager(
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_contact_no VARCHAR(50),
  IN p_branch_id INT
)
BEGIN
  INSERT INTO business_manager (
    first_name, 
    last_name, 
    email, 
    password, 
    contact_no,
    branch_id,
    created_at
  ) VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_password,
    p_contact_no,
    p_branch_id,
    NOW()
  );
  SELECT LAST_INSERT_ID() as business_manager_id;
END$$

-- =============================================
-- Update branch manager
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateBranchManager$$
CREATE PROCEDURE sp_updateBranchManager(
  IN p_business_manager_id INT,
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_contact_no VARCHAR(50),
  IN p_branch_id INT
)
BEGIN
  UPDATE business_manager 
  SET 
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    email = COALESCE(p_email, email),
    contact_no = COALESCE(p_contact_no, contact_no),
    branch_id = COALESCE(p_branch_id, branch_id)
  WHERE business_manager_id = p_business_manager_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Delete branch manager
-- =============================================
DROP PROCEDURE IF EXISTS sp_deleteBranchManager$$
CREATE PROCEDURE sp_deleteBranchManager(
  IN p_business_manager_id INT
)
BEGIN
  DELETE FROM business_manager 
  WHERE business_manager_id = p_business_manager_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get applicant count
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantCount$$
CREATE PROCEDURE sp_getApplicantCount()
BEGIN
  SELECT COUNT(*) as total FROM applicant;
END$$

-- =============================================
-- Get applicant by ID with details
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantByIdFull$$
CREATE PROCEDURE sp_getApplicantByIdFull(
  IN p_applicant_id INT
)
BEGIN
  SELECT 
    applicant_id,
    applicant_full_name,
    applicant_contact_number,
    applicant_email,
    applicant_address,
    applicant_birthdate,
    applicant_civil_status,
    applicant_educational_attainment,
    created_date
  FROM applicant
  WHERE applicant_id = p_applicant_id;
END$$

-- =============================================
-- Get registration ID from credential
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRegistrationId$$
CREATE PROCEDURE sp_getRegistrationId(
  IN p_applicant_id INT
)
BEGIN
  SELECT registrationid 
  FROM credential 
  WHERE applicant_id = p_applicant_id;
END$$

-- =============================================
-- Insert application
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertApplication$$
CREATE PROCEDURE sp_insertApplication(
  IN p_applicant_id INT,
  IN p_stall_id INT,
  IN p_application_status VARCHAR(50),
  IN p_notes TEXT
)
BEGIN
  INSERT INTO application (
    applicant_id,
    stall_id,
    application_status,
    notes,
    created_at
  ) VALUES (
    p_applicant_id,
    p_stall_id,
    COALESCE(p_application_status, 'pending'),
    p_notes,
    NOW()
  );
  SELECT LAST_INSERT_ID() as application_id;
END$$

-- =============================================
-- Get penalty payments view
-- =============================================
DROP PROCEDURE IF EXISTS sp_getPenaltyPaymentsAll$$
CREATE PROCEDURE sp_getPenaltyPaymentsAll()
BEGIN
  SELECT * FROM penalty_payments_view;
END$$

-- =============================================
-- Get penalty payments by branch IDs
-- =============================================
DROP PROCEDURE IF EXISTS sp_getPenaltyPaymentsByBranches$$
CREATE PROCEDURE sp_getPenaltyPaymentsByBranches(
  IN p_branch_ids TEXT
)
BEGIN
  SET @sql = CONCAT('SELECT * FROM penalty_payments_view WHERE FIND_IN_SET(branch_id, ''', p_branch_ids, ''')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- Success message
SELECT 'Auth and Application Management stored procedures created successfully' as status;
