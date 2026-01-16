-- ========================================
-- BUSINESS OWNER MANAGEMENT PROCEDURES
-- ========================================
-- Run this in MySQL Workbench connected to DigitalOcean
-- After running MASTER_EMAIL_LOGIN_MIGRATION.sql
-- ========================================

USE naga_stall;

DELIMITER $$

-- ========================================
-- SUBSCRIPTION PLANS TABLE & PROCEDURES
-- ========================================

-- Create subscription_plans table if not exists
CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id INT(11) NOT NULL AUTO_INCREMENT,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_months INT DEFAULT 1,
  max_branches INT DEFAULT 1,
  max_stalls INT DEFAULT 10,
  features JSON,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

-- Insert default subscription plans
INSERT IGNORE INTO subscription_plans (plan_id, plan_name, description, price, duration_months, max_branches, max_stalls, status)
VALUES 
  (1, 'Basic', 'Basic plan for small markets', 999.00, 1, 1, 10, 'Active'),
  (2, 'Standard', 'Standard plan for medium markets', 2499.00, 1, 3, 50, 'Active'),
  (3, 'Premium', 'Premium plan for large markets', 4999.00, 1, 10, 200, 'Active'),
  (4, 'Enterprise', 'Enterprise plan with unlimited features', 9999.00, 1, 999, 9999, 'Active')$$

-- Get All Subscription Plans
DROP PROCEDURE IF EXISTS getAllSubscriptionPlans$$
CREATE PROCEDURE getAllSubscriptionPlans()
BEGIN
    SELECT 
        plan_id,
        plan_name,
        description,
        price,
        duration_months,
        max_branches,
        max_stalls,
        features,
        status,
        created_at
    FROM subscription_plans
    WHERE status = 'Active'
    ORDER BY price ASC;
END$$

-- ========================================
-- BUSINESS OWNER SUBSCRIPTION TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS business_owner_subscriptions (
  subscription_id INT(11) NOT NULL AUTO_INCREMENT,
  business_owner_id INT(11) NOT NULL,
  plan_id INT(11) NOT NULL,
  start_date DATE,
  end_date DATE,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  payment_status ENUM('Pending','Paid','Overdue','Cancelled') DEFAULT 'Pending',
  status ENUM('Active','Expired','Cancelled','Suspended') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id),
  KEY fk_subscription_owner (business_owner_id),
  KEY fk_subscription_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

-- ========================================
-- CREATE BUSINESS OWNER WITH SUBSCRIPTION
-- ========================================
-- Note: Email stored as PLAIN TEXT, password and names are ENCRYPTED

DROP PROCEDURE IF EXISTS createBusinessOwnerWithSubscription$$
CREATE PROCEDURE createBusinessOwnerWithSubscription(
    IN p_password VARCHAR(500),       -- Already encrypted with AES-256-GCM
    IN p_full_name VARCHAR(500),      -- Already encrypted
    IN p_first_name VARCHAR(500),     -- Already encrypted
    IN p_last_name VARCHAR(500),      -- Already encrypted
    IN p_email VARCHAR(500),          -- PLAIN TEXT for login
    IN p_contact_number VARCHAR(500), -- Already encrypted
    IN p_plan_id INT,
    IN p_created_by_admin INT
)
BEGIN
    DECLARE new_owner_id INT;
    DECLARE v_plan_duration INT DEFAULT 1;
    
    -- Get plan duration
    SELECT duration_months INTO v_plan_duration 
    FROM subscription_plans WHERE plan_id = p_plan_id;
    
    -- Insert business owner
    INSERT INTO stall_business_owner (
        owner_password,
        owner_full_name,
        first_name,
        last_name,
        email,
        contact_number,
        created_by_system_admin,
        status,
        subscription_status
    ) VALUES (
        p_password,
        p_full_name,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_number,
        p_created_by_admin,
        'Active',
        'Pending'
    );
    
    SET new_owner_id = LAST_INSERT_ID();
    
    -- Create subscription record
    INSERT INTO business_owner_subscriptions (
        business_owner_id,
        plan_id,
        start_date,
        end_date,
        payment_status,
        status
    ) VALUES (
        new_owner_id,
        p_plan_id,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL v_plan_duration MONTH),
        'Pending',
        'Active'
    );
    
    SELECT new_owner_id AS business_owner_id, 
           'Business owner created successfully' AS message;
END$$

-- ========================================
-- GET ALL BUSINESS OWNERS WITH SUBSCRIPTION
-- ========================================

DROP PROCEDURE IF EXISTS getAllBusinessOwnersWithSubscription$$
CREATE PROCEDURE getAllBusinessOwnersWithSubscription()
BEGIN
    SELECT 
        bo.business_owner_id,
        bo.email,
        bo.owner_full_name,
        bo.first_name,
        bo.last_name,
        bo.contact_number,
        bo.status,
        bo.subscription_status,
        bo.created_at,
        bo.last_login,
        bos.subscription_id,
        bos.plan_id,
        bos.start_date,
        bos.end_date,
        bos.payment_status,
        sp.plan_name,
        sp.price as plan_price
    FROM stall_business_owner bo
    LEFT JOIN business_owner_subscriptions bos ON bo.business_owner_id = bos.business_owner_id
    LEFT JOIN subscription_plans sp ON bos.plan_id = sp.plan_id
    ORDER BY bo.created_at DESC;
END$$

-- ========================================
-- GET BUSINESS OWNER SUBSCRIPTION DETAILS
-- ========================================

DROP PROCEDURE IF EXISTS getBusinessOwnerSubscription$$
CREATE PROCEDURE getBusinessOwnerSubscription(IN p_business_owner_id INT)
BEGIN
    SELECT 
        bo.business_owner_id,
        bo.email,
        bo.owner_full_name,
        bo.first_name,
        bo.last_name,
        bo.contact_number,
        bo.status,
        bo.subscription_status,
        bos.subscription_id,
        bos.plan_id,
        bos.start_date,
        bos.end_date,
        bos.amount_paid,
        bos.payment_status,
        bos.status as subscription_active,
        sp.plan_name,
        sp.description as plan_description,
        sp.price,
        sp.duration_months,
        sp.max_branches,
        sp.max_stalls
    FROM stall_business_owner bo
    LEFT JOIN business_owner_subscriptions bos ON bo.business_owner_id = bos.business_owner_id
    LEFT JOIN subscription_plans sp ON bos.plan_id = sp.plan_id
    WHERE bo.business_owner_id = p_business_owner_id;
END$$

-- ========================================
-- SYSTEM ADMIN DASHBOARD STATS
-- ========================================

DROP PROCEDURE IF EXISTS getSystemAdminDashboardStats$$
CREATE PROCEDURE getSystemAdminDashboardStats()
BEGIN
    -- Get counts for dashboard
    SELECT 
        (SELECT COUNT(*) FROM stall_business_owner WHERE status = 'Active') as total_business_owners,
        (SELECT COUNT(*) FROM stall_business_owner WHERE subscription_status = 'Active') as active_subscriptions,
        (SELECT COUNT(*) FROM stall_business_owner WHERE subscription_status = 'Pending') as pending_subscriptions,
        (SELECT COUNT(*) FROM business_owner_subscriptions WHERE payment_status = 'Pending') as pending_payments,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM business_owner_subscriptions WHERE payment_status = 'Paid') as total_revenue,
        (SELECT COUNT(*) FROM branch) as total_branches,
        (SELECT COUNT(*) FROM stall WHERE status = 'Available') as available_stalls,
        (SELECT COUNT(*) FROM stall WHERE status = 'Occupied') as occupied_stalls;
END$$

-- ========================================
-- UPDATE SUBSCRIPTION PAYMENT STATUS
-- ========================================

DROP PROCEDURE IF EXISTS updateSubscriptionPayment$$
CREATE PROCEDURE updateSubscriptionPayment(
    IN p_subscription_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_status VARCHAR(20)
)
BEGIN
    UPDATE business_owner_subscriptions
    SET amount_paid = p_amount,
        payment_status = p_payment_status,
        updated_at = NOW()
    WHERE subscription_id = p_subscription_id;
    
    -- Update business owner subscription status if paid
    IF p_payment_status = 'Paid' THEN
        UPDATE stall_business_owner bo
        INNER JOIN business_owner_subscriptions bos ON bo.business_owner_id = bos.business_owner_id
        SET bo.subscription_status = 'Active'
        WHERE bos.subscription_id = p_subscription_id;
    END IF;
    
    SELECT 'Subscription payment updated successfully' AS message;
END$$

-- ========================================
-- CREATE BRANCH TABLE IF NOT EXISTS
-- ========================================

CREATE TABLE IF NOT EXISTS branch (
  branch_id INT(11) NOT NULL AUTO_INCREMENT,
  branch_name VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  location VARCHAR(500),
  address TEXT,
  contact_number VARCHAR(100),
  email VARCHAR(255),
  status ENUM('Active','Inactive') DEFAULT 'Active',
  business_owner_id INT(11),
  business_manager_id INT(11),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (branch_id),
  KEY fk_branch_owner (business_owner_id),
  KEY fk_branch_manager (business_manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

-- ========================================
-- CREATE STALL TABLE IF NOT EXISTS
-- ========================================

CREATE TABLE IF NOT EXISTS stall (
  stall_id INT(11) NOT NULL AUTO_INCREMENT,
  stall_number VARCHAR(50) NOT NULL,
  stall_name VARCHAR(255),
  stall_type VARCHAR(100),
  stall_size VARCHAR(50),
  monthly_rent DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Available','Occupied','Reserved','Maintenance') DEFAULT 'Available',
  branch_id INT(11),
  stallholder_id INT(11),
  floor_level VARCHAR(50),
  section VARCHAR(100),
  description TEXT,
  amenities JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stall_id),
  KEY fk_stall_branch (branch_id),
  KEY fk_stall_holder (stallholder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci$$

DELIMITER ;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT '✅ Business Owner Management procedures created!' AS status;
SELECT '✅ Subscription Plans table created!' AS status;
SELECT '✅ Branch and Stall tables created!' AS status;

-- Show what was created
SHOW PROCEDURE STATUS WHERE Db = 'naga_stall' AND Name LIKE '%Subscription%' OR Name LIKE '%BusinessOwner%' OR Name LIKE '%Dashboard%';
