-- ========================================
-- SAMPLE DATA FOR VENDOR AND COLLECTOR TABLES
-- ========================================
-- Date: January 8, 2026
-- Description: Insert sample data for testing vendor and collector functionality

-- ========================================
-- INSERT SAMPLE COLLECTORS
-- ========================================

-- Sample Collector 1: Maria Santos
INSERT INTO collector (
    username, 
    password_hash, 
    first_name, 
    last_name, 
    middle_name,
    email, 
    contact_no,
    date_hired,
    status
) VALUES (
    'COL1001',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxuR9H2', -- password: Collector123
    'Maria',
    'Santos',
    'Cruz',
    'maria.santos@digistall.com',
    '09171234567',
    '2025-12-01',
    'active'
);

-- Sample Collector 2: Juan Reyes
INSERT INTO collector (
    username, 
    password_hash, 
    first_name, 
    last_name, 
    middle_name,
    email, 
    contact_no,
    date_hired,
    status
) VALUES (
    'COL1002',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxuR9H2', -- password: Collector123
    'Juan',
    'Reyes',
    'Garcia',
    'juan.reyes@digistall.com',
    '09187654321',
    '2025-12-15',
    'active'
);

-- Sample Collector 3: Ana Mendoza
INSERT INTO collector (
    username, 
    password_hash, 
    first_name, 
    last_name, 
    middle_name,
    email, 
    contact_no,
    date_hired,
    status
) VALUES (
    'COL1003',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxuR9H2', -- password: Collector123
    'Ana',
    'Mendoza',
    'Lopez',
    'ana.mendoza@digistall.com',
    '09191234567',
    '2026-01-05',
    'active'
);

-- ========================================
-- INSERT COLLECTOR ASSIGNMENTS (Link collectors to Branch 1)
-- ========================================

INSERT INTO collector_assignment (
    collector_id,
    branch_id,
    start_date,
    status,
    remarks
) VALUES 
    ((SELECT collector_id FROM collector WHERE username = 'COL1001'), 1, '2025-12-01', 'Active', 'Assigned to Naga City Main Market'),
    ((SELECT collector_id FROM collector WHERE username = 'COL1002'), 1, '2025-12-15', 'Active', 'Assigned to Naga City Main Market'),
    ((SELECT collector_id FROM collector WHERE username = 'COL1003'), 1, '2026-01-05', 'Active', 'Assigned to Naga City Main Market');

-- ========================================
-- INSERT SAMPLE VENDORS
-- ========================================

-- Sample Vendor 1: Pedro Dela Cruz (Street Food)
INSERT INTO vendor (
    first_name,
    last_name,
    middle_name,
    phone,
    email,
    birthdate,
    gender,
    address,
    business_name,
    business_type,
    business_description,
    vendor_identifier,
    collector_id,
    status
) VALUES (
    'Pedro',
    'Dela Cruz',
    'Santos',
    '09171111111',
    'pedro.delacruz@gmail.com',
    '1985-05-15',
    'Male',
    'Block 5 Lot 12, Barangay San Felipe, Naga City',
    'Pedro\'s Street Foods',
    'Street Food',
    'Selling fish balls, kikiam, and squid balls',
    'VEN2026-001',
    (SELECT collector_id FROM collector WHERE username = 'COL1001'),
    'Active'
);

-- Sample Vendor 2: Teresa Ramos (Fresh Produce)
INSERT INTO vendor (
    first_name,
    last_name,
    middle_name,
    phone,
    email,
    birthdate,
    gender,
    address,
    business_name,
    business_type,
    business_description,
    vendor_identifier,
    collector_id,
    status
) VALUES (
    'Teresa',
    'Ramos',
    'Garcia',
    '09182222222',
    'teresa.ramos@yahoo.com',
    '1978-09-22',
    'Female',
    'Purok 3, Barangay Triangulo, Naga City',
    'Aling Tere\'s Fresh Vegetables',
    'Fresh Produce',
    'Selling fresh vegetables and fruits from local farmers',
    'VEN2026-002',
    (SELECT collector_id FROM collector WHERE username = 'COL1001'),
    'Active'
);

-- Sample Vendor 3: Roberto Villanueva (Dry Goods)
INSERT INTO vendor (
    first_name,
    last_name,
    middle_name,
    phone,
    email,
    birthdate,
    gender,
    address,
    business_name,
    business_type,
    business_description,
    vendor_identifier,
    collector_id,
    status
) VALUES (
    'Roberto',
    'Villanueva',
    'Fernandez',
    '09193333333',
    'roberto.villanueva@outlook.com',
    '1990-11-08',
    'Male',
    'Zone 7, Barangay Liboton, Naga City',
    'Rob\'s Dry Goods Store',
    'Dry Goods',
    'Selling rice, canned goods, and cooking ingredients',
    'VEN2026-003',
    (SELECT collector_id FROM collector WHERE username = 'COL1002'),
    'Active'
);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check inserted collectors
SELECT 
    collector_id,
    username,
    CONCAT(first_name, ' ', last_name) AS full_name,
    email,
    contact_no,
    status,
    date_hired
FROM collector
WHERE username IN ('COL1001', 'COL1002', 'COL1003')
ORDER BY collector_id;

-- Check collector assignments
SELECT 
    ca.assignment_id,
    CONCAT(c.first_name, ' ', c.last_name) AS collector_name,
    ca.branch_id,
    ca.start_date,
    ca.status,
    ca.remarks
FROM collector_assignment ca
JOIN collector c ON ca.collector_id = c.collector_id
WHERE c.username IN ('COL1001', 'COL1002', 'COL1003')
ORDER BY ca.assignment_id;

-- Check inserted vendors
SELECT 
    v.vendor_id,
    v.vendor_identifier,
    CONCAT(v.first_name, ' ', v.last_name) AS vendor_name,
    v.business_name,
    v.business_type,
    CONCAT(c.first_name, ' ', c.last_name) AS assigned_collector,
    v.status
FROM vendor v
LEFT JOIN collector c ON v.collector_id = c.collector_id
WHERE v.vendor_identifier IN ('VEN2026-001', 'VEN2026-002', 'VEN2026-003')
ORDER BY v.vendor_id;

-- ========================================
-- NOTES
-- ========================================
-- Default Password for all collectors: Collector123
-- All collectors are assigned to Branch ID 1 (Naga City Main Market)
-- Vendors are distributed between collectors COL1001 and COL1002
-- All records are set to 'Active' status
-- ========================================
