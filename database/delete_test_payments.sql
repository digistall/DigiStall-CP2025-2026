-- Delete test payment records
-- Run this in phpMyAdmin to clear the test payments

-- First, check what payments exist
SELECT payment_id, stallholder_id, amount, payment_date, reference_number, notes 
FROM payments 
ORDER BY payment_id DESC;

-- Step 1: Find the last 2 payment IDs (copy the IDs you see)
-- Step 2: Replace the numbers below with the actual payment IDs you want to delete

-- Delete the last 2 payments (replace 1,2 with actual IDs from the SELECT above):
DELETE FROM payments WHERE payment_id IN (1, 2);

-- OR delete ALL payments (be careful!):
-- TRUNCATE TABLE payments;

-- After deleting, verify:
SELECT COUNT(*) as total_payments FROM payments;
