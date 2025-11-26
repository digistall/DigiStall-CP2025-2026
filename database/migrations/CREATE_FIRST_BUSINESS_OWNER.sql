-- Quick Start: Create Your First Business Owner Account
-- Run this after applying migration 029

-- Step 1: Check available Business Managers
SELECT 
    business_manager_id,
    manager_username,
    CONCAT(first_name, ' ', last_name) as manager_name,
    branch_id,
    (SELECT branch_name FROM branch WHERE branch_id = bm.branch_id) as branch_name
FROM business_manager bm
WHERE status = 'Active';

-- Step 2: Check available Subscription Plans
SELECT 
    plan_id,
    plan_name,
    plan_description,
    monthly_fee,
    max_branches,
    max_employees
FROM subscription_plans
WHERE status = 'Active';

-- Step 3: Create Business Owner with Manager Connection
-- Example: Create owner connected to NCPM_Manager with Standard Plan

CALL createBusinessOwnerWithManagerConnection(
    'businessowner1',                    -- username
    '$2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a',  -- password hash (password: owner123)
    'Business',                          -- first name
    'Owner',                             -- last name
    'owner@nagastall.com',               -- email
    '+639171111111',                     -- contact number
    2,                                   -- plan_id (2 = Standard Plan ₱10,000/month)
    1,                                   -- primary_manager_id (1 = NCPM_Manager)
    '[3]',                               -- additional managers [3 = Satellite_Manager]
    1                                    -- created_by_system_admin (1 = sysadmin)
);

-- Step 4: Verify Creation
-- Check Business Owner created
SELECT * FROM stall_business_owner WHERE business_owner_username = 'businessowner1';

-- Check Manager connections
CALL getBusinessOwnerManagers(LAST_INSERT_ID());

-- Step 5: Test Login
-- Frontend Login Credentials:
-- Username: businessowner1
-- Password: owner123

-- Expected Result:
-- ✅ Login successful
-- ✅ Dashboard loads
-- ✅ Main menu shows: Dashboard, Payment, Branch, Applicants, Complaints
-- ✅ More button visible (hover sidebar)
-- ✅ More menu shows: Employees, Vendors, Stallholders, Stalls, Collectors, Inspectors, Compliances, My Subscription
-- ✅ My Subscription page shows Standard Plan details

-- Step 6: Create Another Owner with Different Plan
CALL createBusinessOwnerWithManagerConnection(
    'premiumowner',
    '$2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a',
    'Premium',
    'Owner',
    'premium@nagastall.com',
    '+639172222222',
    3,           -- Premium Plan (₱20,000/month, unlimited branches/employees)
    1,           -- NCPM_Manager
    '[3, 16]',   -- Satellite_Manager AND Test_Manager
    1
);

-- Step 7: Manager View - See All Their Business Owners
-- NCPM_Manager (ID 1) checks their owners
CALL getManagerBusinessOwners(1);

-- Expected Result:
-- Returns all Business Owners managed by NCPM_Manager
-- Shows subscription status, expiry dates, plan details

-- Step 8: Assign Additional Manager to Existing Owner
-- Add Test_Manager to businessowner1
CALL assignManagerToBusinessOwner(
    2,              -- business_owner_id (check Step 4 result)
    16,             -- business_manager_id (Test_Manager)
    'Full',         -- access_level
    1,              -- assigned_by_system_admin
    'Adding Test_Manager for additional support'
);

-- Step 9: Verify All Relationships
-- See all manager-owner connections
SELECT 
    bom.relationship_id,
    CONCAT(sbo.first_name, ' ', sbo.last_name) as owner_name,
    CONCAT(bm.first_name, ' ', bm.last_name) as manager_name,
    bom.is_primary,
    bom.access_level,
    b.branch_name
FROM business_owner_managers bom
INNER JOIN stall_business_owner sbo ON bom.business_owner_id = sbo.business_owner_id
INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
LEFT JOIN branch b ON bm.branch_id = b.branch_id
WHERE bom.status = 'Active'
ORDER BY sbo.business_owner_id, bom.is_primary DESC;

-- Step 10: Test Password Hashing (Optional)
-- If you need to create custom passwords, use this in Node.js backend:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('yourpassword', 10);
-- Then use the hash in the SQL above

-- Common Passwords (Pre-hashed):
-- owner123  -> $2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a
-- admin123  -> $2b$10$ybs4aIFL9OlkD55HerFTPO3xIVDl.1mP2aCVTEGG2Z8FnKSkjCts.
