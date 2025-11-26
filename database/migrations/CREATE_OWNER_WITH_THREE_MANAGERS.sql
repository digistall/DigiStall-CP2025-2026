-- Create Business Owner Account Connected to 3 Business Managers
-- Run this after migration 029 is applied

-- Step 1: View available Business Managers
SELECT 
    business_manager_id,
    manager_username,
    CONCAT(first_name, ' ', last_name) as manager_name,
    branch_id,
    (SELECT branch_name FROM branch WHERE branch_id = bm.branch_id) as branch_name,
    status
FROM business_manager bm
WHERE status = 'Active'
ORDER BY business_manager_id;

-- Step 2: View available Subscription Plans
SELECT 
    plan_id,
    plan_name,
    monthly_fee,
    max_branches,
    max_employees,
    status
FROM subscription_plans
WHERE status = 'Active';

-- Step 3: Create Business Owner connected to THREE Business Managers
-- Assuming we have business_manager_id: 1, 3, and 16 from the database
-- Manager 1 will be the PRIMARY manager
-- Managers 3 and 16 will be ADDITIONAL managers

DELIMITER //

DROP PROCEDURE IF EXISTS CreateOwnerWithThreeManagers//

CREATE PROCEDURE CreateOwnerWithThreeManagers()
BEGIN
    DECLARE v_business_owner_id INT;
    DECLARE v_subscription_id INT;
    DECLARE v_manager1_id INT DEFAULT 1;   -- NCPM_Manager (Primary)
    DECLARE v_manager2_id INT DEFAULT 3;   -- Satellite_Manager
    DECLARE v_manager3_id INT DEFAULT 16;  -- Test_Manager
    
    -- Create Business Owner with 3 managers
    CALL createBusinessOwnerWithManagerConnection(
        'multimanager_owner',                -- username
        '$2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a',  -- password: owner123
        'Multi',                             -- first_name
        'Manager Owner',                     -- last_name
        'multiowner@nagastall.com',          -- email
        '+639173333333',                     -- contact_number
        2,                                   -- plan_id (2 = Standard Plan ₱10,000/month)
        1,                                   -- primary_manager_id (NCPM_Manager)
        '[3, 16]',                           -- additional_manager_ids JSON array
        1                                    -- created_by_system_admin
    );
    
    -- Get the created Business Owner ID
    SELECT business_owner_id INTO v_business_owner_id 
    FROM stall_business_owner 
    WHERE owner_username = 'multimanager_owner';
    
    -- Display success message
    SELECT 
        v_business_owner_id as 'Business Owner ID Created',
        'multimanager_owner' as 'Username',
        'owner123' as 'Password',
        'Connected to 3 Managers' as 'Status';
    
    -- Show all manager connections
    SELECT 
        bom.relationship_id,
        bom.business_owner_id,
        bom.business_manager_id,
        CONCAT(bm.first_name, ' ', bm.last_name) as manager_name,
        bm.manager_username,
        bom.is_primary,
        bom.access_level,
        bom.status
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    WHERE bom.business_owner_id = v_business_owner_id
    ORDER BY bom.is_primary DESC, bom.business_manager_id;
    
END//

DELIMITER ;

-- Execute the procedure
CALL CreateOwnerWithThreeManagers();

-- Verify the creation
SELECT '=== Business Owner Details ===' as '';
SELECT 
    business_owner_id,
    owner_username,
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    contact_number,
    primary_manager_id,
    created_at
FROM stall_business_owner 
WHERE owner_username = 'multimanager_owner';

SELECT '=== Subscription Details ===' as '';
SELECT 
    bos.subscription_id,
    sp.plan_name,
    sp.monthly_fee,
    bos.start_date,
    bos.end_date,
    bos.subscription_status,
    DATEDIFF(bos.end_date, CURDATE()) as days_remaining
FROM business_owner_subscriptions bos
INNER JOIN subscription_plans sp ON bos.plan_id = sp.plan_id
WHERE bos.business_owner_id = (
    SELECT business_owner_id 
    FROM stall_business_owner 
    WHERE owner_username = 'multimanager_owner'
);

SELECT '=== All 3 Manager Connections ===' as '';
SELECT 
    bom.relationship_id,
    CONCAT(bm.first_name, ' ', bm.last_name) as manager_name,
    bm.manager_username,
    CASE 
        WHEN bom.is_primary = 1 THEN 'PRIMARY MANAGER'
        ELSE 'ADDITIONAL MANAGER'
    END as manager_type,
    bom.access_level,
    (SELECT branch_name FROM branch WHERE branch_id = bm.branch_id) as branch_name,
    bom.assigned_date,
    bom.status
FROM business_owner_managers bom
INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
WHERE bom.business_owner_id = (
    SELECT business_owner_id 
    FROM stall_business_owner 
    WHERE owner_username = 'multimanager_owner'
)
ORDER BY bom.is_primary DESC, bm.business_manager_id;

-- Test: View from Manager's perspective
SELECT '=== Manager 1 (NCPM_Manager) - Their Business Owners ===' as '';
CALL getManagerBusinessOwners(1);

SELECT '=== Manager 3 (Satellite_Manager) - Their Business Owners ===' as '';
CALL getManagerBusinessOwners(3);

SELECT '=== Manager 16 (Test_Manager) - Their Business Owners ===' as '';
CALL getManagerBusinessOwners(16);

-- Test: View from Owner's perspective
SELECT '=== Business Owner - All Their Managers ===' as '';
CALL getBusinessOwnerManagers((
    SELECT business_owner_id 
    FROM stall_business_owner 
    WHERE owner_username = 'multimanager_owner'
));

-- Login Credentials Summary
SELECT '=== LOGIN CREDENTIALS ===' as '';
SELECT 
    'multimanager_owner' as username,
    'owner123' as password,
    'Business Owner with 3 Managers' as account_type,
    'Manager 1: NCPM_Manager (Primary)' as manager_1,
    'Manager 3: Satellite_Manager (Additional)' as manager_2,
    'Manager 16: Test_Manager (Additional)' as manager_3;

-- Cleanup procedure
DROP PROCEDURE IF EXISTS CreateOwnerWithThreeManagers;
