-- Verify and insert subscription plans if missing
-- Run this to ensure the 3 subscription plans exist in the database

USE naga_stall;

-- Check if subscription_plans table exists
SELECT 'Checking subscription_plans table...' AS status;
SHOW TABLES LIKE 'subscription_plans';

-- Check current plans
SELECT 'Current subscription plans in database:' AS status;
SELECT 
    plan_id,
    plan_name,
    plan_description,
    monthly_fee,
    max_branches,
    max_employees,
    status
FROM subscription_plans
ORDER BY monthly_fee;

-- If no plans exist, insert the default 3 plans
INSERT IGNORE INTO subscription_plans (plan_name, plan_description, monthly_fee, max_branches, max_employees, features, status) VALUES
('Basic Plan', 'Perfect for small business with 1-2 branches', 5000.00, 2, 10, 
    JSON_OBJECT(
        'max_stalls', 50,
        'priority_support', false,
        'advanced_reporting', false
    ), 
    'Active'
),
('Standard Plan', 'Ideal for growing businesses', 10000.00, 5, 25,
    JSON_OBJECT(
        'max_stalls', 150,
        'priority_support', false,
        'advanced_reporting', true
    ),
    'Active'
),
('Premium Plan', 'Complete solution for large businesses', 20000.00, 999, 999,
    JSON_OBJECT(
        'max_stalls', 999,
        'priority_support', true,
        'advanced_reporting', true
    ),
    'Active'
);

-- Verify plans were inserted
SELECT 'Final verification - subscription plans:' AS status;
SELECT 
    plan_id,
    plan_name,
    CONCAT('₱', FORMAT(monthly_fee, 2)) AS price,
    max_branches AS branches,
    max_employees AS employees,
    status
FROM subscription_plans
ORDER BY monthly_fee;

SELECT CONCAT('Total plans available: ', COUNT(*)) AS summary
FROM subscription_plans
WHERE status = 'Active';
