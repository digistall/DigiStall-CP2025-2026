-- ============================================================================
-- PAYMENT STORED PROCEDURES TEST SCRIPT
-- This script tests all payment procedures with real data from your database
-- ============================================================================

-- ============================================================================
-- TEST 1: Get all payments with detailed information
-- ============================================================================
CALL getAllPaymentsDetailed(1, NULL, 'completed', '2025-11-01', '2025-11-13', 10, 0);

-- ============================================================================
-- TEST 2: Get payments for specific branch and method
-- ============================================================================
CALL getAllPaymentsDetailed(1, 'onsite', NULL, NULL, NULL, 5, 0);

-- ============================================================================
-- TEST 3: Add new onsite payment
-- ============================================================================
CALL addOnsitePayment(
    1,                              -- stallholder_id (Maria Santos)
    2500.00,                        -- amount
    CURDATE(),                      -- payment_date
    CURTIME(),                      -- payment_time
    DATE_FORMAT(CURDATE(), '%Y-%m'), -- payment_for_month
    'rental',                       -- payment_type
    'RCP-TEST-001',                 -- reference_number
    'Test Manager',                 -- collected_by
    'Test onsite payment',          -- notes
    1                               -- created_by
);

-- ============================================================================
-- TEST 4: Process online payment
-- ============================================================================
CALL processOnlinePayment(
    2,                              -- stallholder_id (Stallholder ID 2)
    3000.00,                        -- amount
    CURDATE(),                      -- payment_date
    CURTIME(),                      -- payment_time
    DATE_FORMAT(CURDATE(), '%Y-%m'), -- payment_for_month
    'rental',                       -- payment_type
    'TXN-TEST-001',                 -- reference_number
    'GCash',                        -- payment_gateway
    'GC123456789',                  -- transaction_id
    'Test online payment via GCash' -- notes
);

-- ============================================================================
-- TEST 5: Get payment summary by branch
-- ============================================================================
CALL getPaymentSummaryByBranch(1, '2025-11-01', '2025-11-13');

-- ============================================================================
-- TEST 6: Get payment summary for all branches
-- ============================================================================
CALL getPaymentSummaryByBranch(NULL, '2025-11-01', '2025-11-13');

-- ============================================================================
-- TEST 7: Get stallholder payment history
-- ============================================================================
CALL getStallholderPaymentHistory(1, 10);

-- ============================================================================
-- TEST 8: Get pending online payments
-- ============================================================================
CALL getPendingOnlinePayments(1);

-- ============================================================================
-- TEST 9: Get payment statistics for November 2025
-- ============================================================================
CALL getPaymentStatistics(1, 2025, 11);

-- ============================================================================
-- TEST 10: Get yearly payment statistics
-- ============================================================================
CALL getPaymentStatistics(NULL, 2025, NULL);

-- ============================================================================
-- TEST 11: Test accepting an online payment (first create a pending payment)
-- ============================================================================

-- Insert a pending payment for testing
INSERT INTO payments (
    stallholder_id, payment_method, amount, payment_date, payment_time,
    payment_for_month, payment_type, reference_number, collected_by,
    payment_status, notes, created_at
) VALUES (
    13, 'online', 2800.00, CURDATE(), CURTIME(),
    DATE_FORMAT(CURDATE(), '%Y-%m'), 'rental', 'TEST-PENDING-001', 
    'PayMaya - PM123456789', 'pending', 'Test pending payment for approval', NOW()
);

-- Get the payment ID
SELECT @test_payment_id := LAST_INSERT_ID();

-- Now accept the payment
CALL acceptOnlinePayment(@test_payment_id, 1, 'Payment verified and approved');

-- ============================================================================
-- TEST 12: Test declining an online payment
-- ============================================================================

-- Insert another pending payment
INSERT INTO payments (
    stallholder_id, payment_method, amount, payment_date, payment_time,
    payment_for_month, payment_type, reference_number, collected_by,
    payment_status, notes, created_at
) VALUES (
    13, 'online', 1500.00, CURDATE(), CURTIME(),
    DATE_FORMAT(CURDATE(), '%Y-%m'), 'rental', 'TEST-DECLINE-001', 
    'BPI Transfer - BPI123456789', 'pending', 'Test payment to be declined', NOW()
);

-- Get the payment ID
SELECT @test_decline_id := LAST_INSERT_ID();

-- Decline the payment
CALL declineOnlinePayment(@test_decline_id, 1, 'Invalid transaction reference number');

-- ============================================================================
-- TEST 13: Update payment status
-- ============================================================================

-- Test updating a payment status
CALL updatePaymentStatus(32, 'completed', 1, 'Manual status update for testing');

-- ============================================================================
-- TEST 14: View results to verify everything works
-- ============================================================================

-- Show recent payments
SELECT 'Recent Payments' as test_section;
SELECT 
    payment_id, stallholder_id, amount, payment_method, payment_status, 
    payment_date, reference_number, LEFT(notes, 100) as notes_preview
FROM payments 
ORDER BY created_at DESC 
LIMIT 5;

-- Show stallholder payment statuses
SELECT 'Stallholder Payment Status' as test_section;
SELECT 
    stallholder_id, stallholder_name, payment_status, last_payment_date,
    monthly_rent
FROM stallholder 
WHERE stallholder_id IN (1, 2, 13)
ORDER BY stallholder_id;

-- Show pending payments
SELECT 'Pending Payments' as test_section;
SELECT 
    payment_id, stallholder_id, amount, payment_method, payment_status,
    reference_number, created_at
FROM payments 
WHERE payment_status = 'pending'
ORDER BY created_at DESC;

-- ============================================================================
-- ADDITIONAL VERIFICATION QUERIES
-- ============================================================================

-- Payment totals by method
SELECT 
    'Payment Method Summary' as report_type,
    payment_method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM payments
WHERE payment_date >= '2025-11-01'
GROUP BY payment_method
ORDER BY total_amount DESC;

-- Monthly payment trends
SELECT 
    'Monthly Trends' as report_type,
    payment_for_month,
    COUNT(*) as payments_count,
    SUM(amount) as monthly_total
FROM payments
WHERE payment_for_month IS NOT NULL
GROUP BY payment_for_month
ORDER BY payment_for_month DESC;

-- Branch payment performance
SELECT 
    'Branch Performance' as report_type,
    COALESCE(b.branch_name, 'Unknown') as branch_name,
    COUNT(p.payment_id) as payment_count,
    SUM(p.amount) as total_collected
FROM payments p
INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
LEFT JOIN branch b ON sh.branch_id = b.branch_id
WHERE p.payment_status = 'completed'
GROUP BY b.branch_name
ORDER BY total_collected DESC;