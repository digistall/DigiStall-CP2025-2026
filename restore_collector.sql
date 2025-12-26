-- Restore deleted collector account
-- Username: COL6806, Password: collector123

-- First, check if collector exists
SELECT * FROM collector WHERE username = 'COL6806';

-- Insert collector if not exists
INSERT INTO collector (collector_id, username, password, first_name, last_name, middle_name, email, contact_number, created_at, hire_date, status, termination_date, termination_reason, last_login)
VALUES (1, 'COL6806', '$2a$12$fyruXNao5wSK1v4DarRBLO03o/odeWS/P9Y9X98ml/RbYWTPNqZIK', 'Jeno Aldrei', 'Laurente', NULL, 'laurentejeno73@gmail.com', '09473430196', '2025-12-09 16:29:10', '2025-12-09', 'active', NULL, NULL, '2025-12-18 02:58:34')
ON DUPLICATE KEY UPDATE
    status = 'active',
    termination_date = NULL,
    termination_reason = NULL;

-- Check if collector_assignment exists
SELECT * FROM collector_assignment WHERE collector_id = 1;

-- Restore collector assignment if needed
INSERT INTO collector_assignment (collector_id, branch_id, assigned_by, assigned_date, status, start_date, end_date, remarks)
SELECT 1, 1, 1, NOW(), 'Active', CURDATE(), NULL, 'Restored after deletion'
WHERE NOT EXISTS (SELECT 1 FROM collector_assignment WHERE collector_id = 1 AND status = 'Active');

-- Verify restoration
SELECT 
    c.collector_id,
    c.username,
    c.first_name,
    c.last_name,
    c.status,
    ca.branch_id,
    ca.status as assignment_status
FROM collector c
LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
WHERE c.username = 'COL6806';
