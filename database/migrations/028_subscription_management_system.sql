-- =====================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM
-- For System Administrator to manage Stall Business Owners
-- =====================================================

-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    plan_description TEXT,
    monthly_fee DECIMAL(10,2) NOT NULL,
    max_branches INT DEFAULT 1,
    max_employees INT DEFAULT 10,
    features JSON,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create business_owner_subscriptions table
CREATE TABLE IF NOT EXISTS business_owner_subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    business_owner_id INT NOT NULL,
    plan_id INT NOT NULL,
    subscription_status ENUM('Active', 'Expired', 'Suspended', 'Pending') DEFAULT 'Pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_by_system_admin INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_owner_id) REFERENCES stall_business_owner(business_owner_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    FOREIGN KEY (created_by_system_admin) REFERENCES system_administrator(system_admin_id),
    INDEX idx_business_owner (business_owner_id),
    INDEX idx_status (subscription_status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    business_owner_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'Check') NOT NULL,
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    reference_number VARCHAR(100),
    receipt_number VARCHAR(100),
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    notes TEXT,
    processed_by_system_admin INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES business_owner_subscriptions(subscription_id) ON DELETE CASCADE,
    FOREIGN KEY (business_owner_id) REFERENCES stall_business_owner(business_owner_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by_system_admin) REFERENCES system_administrator(system_admin_id),
    INDEX idx_business_owner (business_owner_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (payment_status),
    INDEX idx_period (payment_period_start, payment_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add subscription fields to stall_business_owner table
ALTER TABLE stall_business_owner
ADD COLUMN IF NOT EXISTS subscription_status ENUM('Active', 'Expired', 'Suspended', 'Pending') DEFAULT 'Pending' AFTER status,
ADD COLUMN IF NOT EXISTS subscription_expiry_date DATE AFTER subscription_status,
ADD COLUMN IF NOT EXISTS last_payment_date DATE AFTER subscription_expiry_date,
ADD INDEX idx_subscription_status (subscription_status);

-- =====================================================
-- Insert default subscription plans
-- =====================================================

INSERT INTO subscription_plans (plan_name, plan_description, monthly_fee, max_branches, max_employees, features) VALUES
('Basic Plan', 'Perfect for small business with 1-2 branches', 5000.00, 2, 10, 
    JSON_OBJECT(
        'branches', 2,
        'employees', 10,
        'stalls', 50,
        'reports', true,
        'support', 'email'
    )
),
('Standard Plan', 'Ideal for growing businesses', 10000.00, 5, 25,
    JSON_OBJECT(
        'branches', 5,
        'employees', 25,
        'stalls', 150,
        'reports', true,
        'advanced_reports', true,
        'support', 'email_phone'
    )
),
('Premium Plan', 'Complete solution for large businesses', 20000.00, 999, 999,
    JSON_OBJECT(
        'branches', 'unlimited',
        'employees', 'unlimited',
        'stalls', 'unlimited',
        'reports', true,
        'advanced_reports', true,
        'custom_reports', true,
        'support', '24/7',
        'priority_support', true
    )
);

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER $$

-- Create new Stall Business Owner with subscription
DROP PROCEDURE IF EXISTS createBusinessOwnerWithSubscription$$
CREATE PROCEDURE createBusinessOwnerWithSubscription(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_contact_number VARCHAR(20),
    IN p_plan_id INT,
    IN p_created_by_system_admin INT
)
BEGIN
    DECLARE v_business_owner_id INT;
    DECLARE v_subscription_id INT;
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error creating business owner with subscription';
    END;
    
    START TRANSACTION;
    
    -- Create business owner account
    INSERT INTO stall_business_owner (
        business_owner_username,
        business_owner_password_hash,
        first_name,
        last_name,
        email,
        contact_number,
        status,
        subscription_status,
        created_by_system_admin
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_number,
        'Active',
        'Pending',
        p_created_by_system_admin
    );
    
    SET v_business_owner_id = LAST_INSERT_ID();
    
    -- Create subscription
    SET v_start_date = CURDATE();
    SET v_end_date = DATE_ADD(v_start_date, INTERVAL 1 MONTH);
    
    INSERT INTO business_owner_subscriptions (
        business_owner_id,
        plan_id,
        subscription_status,
        start_date,
        end_date,
        created_by_system_admin
    ) VALUES (
        v_business_owner_id,
        p_plan_id,
        'Pending',
        v_start_date,
        v_end_date,
        p_created_by_system_admin
    );
    
    SET v_subscription_id = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Return created records
    SELECT 
        v_business_owner_id as business_owner_id,
        v_subscription_id as subscription_id,
        v_start_date as start_date,
        v_end_date as end_date;
END$$

-- Record subscription payment
DROP PROCEDURE IF EXISTS recordSubscriptionPayment$$
CREATE PROCEDURE recordSubscriptionPayment(
    IN p_subscription_id INT,
    IN p_business_owner_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_date DATE,
    IN p_payment_method VARCHAR(50),
    IN p_reference_number VARCHAR(100),
    IN p_payment_period_start DATE,
    IN p_payment_period_end DATE,
    IN p_notes TEXT,
    IN p_processed_by_system_admin INT
)
BEGIN
    DECLARE v_payment_id INT;
    DECLARE v_receipt_number VARCHAR(100);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error recording subscription payment';
    END;
    
    START TRANSACTION;
    
    -- Generate receipt number
    SET v_receipt_number = CONCAT('RCPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9999), 4, '0'));
    
    -- Insert payment record
    INSERT INTO subscription_payments (
        subscription_id,
        business_owner_id,
        amount,
        payment_date,
        payment_method,
        payment_status,
        reference_number,
        receipt_number,
        payment_period_start,
        payment_period_end,
        notes,
        processed_by_system_admin
    ) VALUES (
        p_subscription_id,
        p_business_owner_id,
        p_amount,
        p_payment_date,
        p_payment_method,
        'Completed',
        p_reference_number,
        v_receipt_number,
        p_payment_period_start,
        p_payment_period_end,
        p_notes,
        p_processed_by_system_admin
    );
    
    SET v_payment_id = LAST_INSERT_ID();
    
    -- Update subscription status to Active
    UPDATE business_owner_subscriptions
    SET subscription_status = 'Active',
        end_date = p_payment_period_end
    WHERE subscription_id = p_subscription_id;
    
    -- Update business owner subscription info
    UPDATE stall_business_owner
    SET subscription_status = 'Active',
        subscription_expiry_date = p_payment_period_end,
        last_payment_date = p_payment_date
    WHERE business_owner_id = p_business_owner_id;
    
    COMMIT;
    
    -- Return payment details
    SELECT 
        v_payment_id as payment_id,
        v_receipt_number as receipt_number,
        'Payment recorded successfully' as message;
END$$

-- Get all subscription plans
DROP PROCEDURE IF EXISTS getAllSubscriptionPlans$$
CREATE PROCEDURE getAllSubscriptionPlans()
BEGIN
    SELECT 
        plan_id,
        plan_name,
        plan_description,
        monthly_fee,
        max_branches,
        max_employees,
        features,
        status,
        created_at
    FROM subscription_plans
    WHERE status = 'Active'
    ORDER BY monthly_fee ASC;
END$$

-- Get business owner subscription details
DROP PROCEDURE IF EXISTS getBusinessOwnerSubscription$$
CREATE PROCEDURE getBusinessOwnerSubscription(
    IN p_business_owner_id INT
)
BEGIN
    SELECT 
        s.subscription_id,
        s.subscription_status,
        s.start_date,
        s.end_date,
        s.auto_renew,
        p.plan_name,
        p.plan_description,
        p.monthly_fee,
        p.max_branches,
        p.max_employees,
        p.features,
        DATEDIFF(s.end_date, CURDATE()) as days_remaining,
        bo.subscription_expiry_date,
        bo.last_payment_date
    FROM business_owner_subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.plan_id
    JOIN stall_business_owner bo ON s.business_owner_id = bo.business_owner_id
    WHERE s.business_owner_id = p_business_owner_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END$$

-- Get all business owners with subscription status
DROP PROCEDURE IF EXISTS getAllBusinessOwnersWithSubscription$$
CREATE PROCEDURE getAllBusinessOwnersWithSubscription()
BEGIN
    SELECT 
        bo.business_owner_id,
        bo.business_owner_username,
        bo.first_name,
        bo.last_name,
        bo.email,
        bo.contact_number,
        bo.status,
        bo.subscription_status,
        bo.subscription_expiry_date,
        bo.last_payment_date,
        DATEDIFF(bo.subscription_expiry_date, CURDATE()) as days_until_expiry,
        s.subscription_id,
        p.plan_name,
        p.monthly_fee,
        CASE 
            WHEN bo.subscription_expiry_date < CURDATE() THEN 'Expired'
            WHEN DATEDIFF(bo.subscription_expiry_date, CURDATE()) <= 7 THEN 'Expiring Soon'
            ELSE 'Active'
        END as payment_status
    FROM stall_business_owner bo
    LEFT JOIN business_owner_subscriptions s ON bo.business_owner_id = s.business_owner_id
    LEFT JOIN subscription_plans p ON s.plan_id = p.plan_id
    ORDER BY bo.created_at DESC;
END$$

-- Get payment history for a business owner
DROP PROCEDURE IF EXISTS getBusinessOwnerPaymentHistory$$
CREATE PROCEDURE getBusinessOwnerPaymentHistory(
    IN p_business_owner_id INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.payment_status,
        p.reference_number,
        p.receipt_number,
        p.payment_period_start,
        p.payment_period_end,
        p.notes,
        sa.username as processed_by,
        CONCAT(sa.first_name, ' ', sa.last_name) as processed_by_name
    FROM subscription_payments p
    LEFT JOIN system_administrator sa ON p.processed_by_system_admin = sa.system_admin_id
    WHERE p.business_owner_id = p_business_owner_id
    ORDER BY p.payment_date DESC;
END$$

-- Get dashboard statistics for System Administrator
DROP PROCEDURE IF EXISTS getSystemAdminDashboardStats$$
CREATE PROCEDURE getSystemAdminDashboardStats()
BEGIN
    -- Total business owners
    SELECT COUNT(*) as total_business_owners FROM stall_business_owner;
    
    -- Active subscriptions
    SELECT COUNT(*) as active_subscriptions 
    FROM stall_business_owner 
    WHERE subscription_status = 'Active';
    
    -- Expiring soon (within 7 days)
    SELECT COUNT(*) as expiring_soon 
    FROM stall_business_owner 
    WHERE subscription_status = 'Active' 
    AND DATEDIFF(subscription_expiry_date, CURDATE()) <= 7
    AND subscription_expiry_date >= CURDATE();
    
    -- Expired subscriptions
    SELECT COUNT(*) as expired_subscriptions 
    FROM stall_business_owner 
    WHERE subscription_expiry_date < CURDATE();
    
    -- Total revenue this month
    SELECT COALESCE(SUM(amount), 0) as revenue_this_month
    FROM subscription_payments
    WHERE payment_status = 'Completed'
    AND MONTH(payment_date) = MONTH(CURDATE())
    AND YEAR(payment_date) = YEAR(CURDATE());
    
    -- Total revenue all time
    SELECT COALESCE(SUM(amount), 0) as total_revenue
    FROM subscription_payments
    WHERE payment_status = 'Completed';
    
    -- Pending payments
    SELECT COUNT(*) as pending_payments
    FROM stall_business_owner
    WHERE subscription_status = 'Pending';
END$$

DELIMITER ;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Note: Actual business owners will be created through the system
-- This is just to show the structure

COMMIT;
