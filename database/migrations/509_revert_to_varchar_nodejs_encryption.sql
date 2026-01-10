-- =============================================
-- 509: Revert Inspector & Collector to VARCHAR (Match Applicant Pattern)
-- Applicant uses Node.js encryption (base64 strings), not MySQL AES_ENCRYPT
-- =============================================

SET SQL_SAFE_UPDATES = 0;

-- =============================================
-- STEP 1: Clear binary data first
-- =============================================

-- Clear inspector binary data
UPDATE inspector SET 
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL;

-- Clear collector binary data
UPDATE collector SET 
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL;

-- =============================================
-- STEP 2: Revert columns back to VARCHAR
-- =============================================

-- Inspector table - revert to VARCHAR
ALTER TABLE inspector 
    MODIFY COLUMN first_name VARCHAR(500) NULL,
    MODIFY COLUMN last_name VARCHAR(500) NULL,
    MODIFY COLUMN email VARCHAR(500) NULL,
    MODIFY COLUMN contact_no VARCHAR(500) NULL;

-- Collector table - revert to VARCHAR
ALTER TABLE collector 
    MODIFY COLUMN first_name VARCHAR(500) NULL,
    MODIFY COLUMN last_name VARCHAR(500) NULL,
    MODIFY COLUMN email VARCHAR(500) NULL,
    MODIFY COLUMN contact_no VARCHAR(500) NULL;

-- =============================================
-- STEP 3: Reset to unencrypted real names
-- =============================================

UPDATE inspector SET is_encrypted = 0;
UPDATE collector SET is_encrypted = 0;

-- Inspector INS4526
UPDATE inspector 
SET 
    first_name = 'Test',
    last_name = 'Inspector',
    email = 'testinspector@example.com',
    contact_no = '09876543289'
WHERE username = 'INS4526';

-- Inspector INS1731
UPDATE inspector 
SET 
    first_name = 'Jonas',
    last_name = 'Laurente',
    email = 'jonas@example.com',
    contact_no = '09876543285'
WHERE username = 'INS1731';

-- Inspector INS2775
UPDATE inspector 
SET 
    first_name = 'Shaikim',
    last_name = 'Lu',
    email = 'shaikim@example.com',
    contact_no = '09876543223'
WHERE username = 'INS2775';

-- Collector COL3126
UPDATE collector 
SET 
    first_name = 'Jeno Aldrei',
    last_name = 'Laurente',
    email = 'laurentejeno73@gmail.com',
    contact_no = '09473430196'
WHERE username = 'COL3126';

-- Collector COL6386
UPDATE collector 
SET 
    first_name = 'Giuseppe',
    last_name = 'Arnaldo',
    email = 'archividox76@gmail.com',
    contact_no = '09352013057'
WHERE username = 'COL6386';

-- =============================================
-- STEP 4: Update stored procedures - NO ENCRYPTION
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getInspectorByUsername$$
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.password as password_hash,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.termination_date,
        i.termination_reason,
        i.last_login,
        i.last_logout,
        i.branch_id,
        b.branch_name,
        b.location
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.username = p_username COLLATE utf8mb4_general_ci 
       OR i.email = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_getCollectorByUsername$$
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.termination_date,
        c.termination_reason,
        c.last_login,
        c.last_logout,
        ca.branch_id,
        b.branch_name,
        b.location
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username COLLATE utf8mb4_general_ci 
       OR c.email = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_createInspectorDirect$$
CREATE PROCEDURE sp_createInspectorDirect(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255),
    IN p_branch_id INT
)
BEGIN
    INSERT INTO inspector (
        username, 
        password,
        first_name, 
        last_name, 
        middle_name, 
        email, 
        contact_no,
        branch_id,
        date_hired,
        status,
        is_encrypted
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_middle_name,
        p_email,
        p_contact_no,
        p_branch_id,
        CURDATE(),
        'active',
        0
    );
    
    SELECT LAST_INSERT_ID() as inspector_id;
END$$

DROP PROCEDURE IF EXISTS sp_createCollectorDirect$$
CREATE PROCEDURE sp_createCollectorDirect(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255)
)
BEGIN
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        middle_name,
        email,
        contact_no,
        date_hired,
        status,
        is_encrypted
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_middle_name,
        p_email,
        p_contact_no,
        CURDATE(),
        'active',
        0
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END$$

DELIMITER ;

-- =============================================
-- STEP 5: Test
-- =============================================
SELECT 'Testing Inspector:' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT 'Testing Collector:' as test;
CALL sp_getCollectorByUsername('COL3126');

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- IMPORTANT NOTE:
-- Encryption will be handled by Node.js backend (like applicant table)
-- NOT by MySQL AES_ENCRYPT
-- The backend will encrypt data before INSERT/UPDATE
-- Data will be stored as base64 strings (readable encrypted text)
-- =============================================
