-- =====================================================
-- Payment Data Setup - Simple Version for Node.js Execution
-- =====================================================

-- 1. INSERT SAMPLE PAYMENT DATA
INSERT IGNORE INTO payments (
  payment_id, stallholder_id, branch_id, amount, payment_method, 
  payment_status, payment_date, payment_time, reference_number, 
  collected_by, notes, created_at, updated_at
) VALUES 
-- Onsite Payments
('PAY001', 1, 1, 2500.00, 'onsite', 'completed', '2024-12-15', '09:30:00', 'REC001', 'Manager Santos', 'December monthly stall fee', NOW(), NOW()),
('PAY002', 2, 1, 3000.00, 'onsite', 'completed', '2024-12-15', '10:15:00', 'REC002', 'Manager Santos', 'December monthly stall fee + utilities', NOW(), NOW()),
('PAY003', 3, 1, 2800.00, 'onsite', 'completed', '2024-12-15', '14:20:00', 'REC003', 'Collector Cruz', 'December monthly stall fee', NOW(), NOW()),
-- Online Payments  
('PAY004', 2, 1, 500.00, 'online', 'completed', '2024-12-16', '16:45:00', 'TXN789012', 'System Auto', 'Additional fee payment via bank transfer', NOW(), NOW()),
('PAY005', 2, 1, 750.00, 'online', 'pending', '2024-12-17', '11:30:00', 'TXN789013', 'System Auto', 'Utility deposit via bank transfer', NOW(), NOW());