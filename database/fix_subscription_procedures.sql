-- Fix for getAllBusinessOwnersWithSubscription procedure
-- This fixes the column name from business_owner_username to owner_username

DELIMITER $$

-- Get all business owners with subscription status
DROP PROCEDURE IF EXISTS getAllBusinessOwnersWithSubscription$$
CREATE PROCEDURE getAllBusinessOwnersWithSubscription()
BEGIN
    SELECT 
        bo.business_owner_id,
        bo.owner_username,
        CONCAT(bo.first_name, ' ', bo.last_name) as full_name,
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

-- Create new Stall Business Owner with subscription (FIXED)
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
        owner_username,
        owner_password_hash,
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
        end_date
    ) VALUES (
        v_business_owner_id,
        p_plan_id,
        'Pending',
        v_start_date,
        v_end_date
    );
    
    SET v_subscription_id = LAST_INSERT_ID();
    
    COMMIT;
    
    SELECT 
        v_business_owner_id as business_owner_id,
        v_subscription_id as subscription_id,
        'Business Owner created successfully' as message;
END$$

DELIMITER ;
