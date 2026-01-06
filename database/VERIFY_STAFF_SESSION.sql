-- =====================================================
-- VERIFY STAFF SESSION SETUP
-- Run this to check if staff session tracking is set up correctly
-- =====================================================

USE naga_stall;

-- Check if staff_session table exists
SELECT 'CHECKING staff_session TABLE...' as step;
SELECT 
    TABLE_NAME,
    ENGINE,
    TABLE_ROWS
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'naga_stall' 
AND TABLE_NAME = 'staff_session';

-- Check if required stored procedures exist
SELECT 'CHECKING STORED PROCEDURES...' as step;
SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME IN (
    'sp_createOrUpdateStaffSession',
    'sp_endStaffSession',
    'sp_updateInspectorLastLogin',
    'sp_updateCollectorLastLogin',
    'sp_updateInspectorLastLogout',
    'sp_updateCollectorLastLogout',
    'sp_getActiveSessionsAll',
    'sp_getActiveSessionsByBranches'
)
ORDER BY ROUTINE_NAME;

-- Check if inspector table has last_login column
SELECT 'CHECKING INSPECTOR TABLE COLUMNS...' as step;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'naga_stall'
AND TABLE_NAME = 'inspector'
AND COLUMN_NAME IN ('last_login', 'last_logout', 'status');

-- Check if collector table has last_login column
SELECT 'CHECKING COLLECTOR TABLE COLUMNS...' as step;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'naga_stall'
AND TABLE_NAME = 'collector'
AND COLUMN_NAME IN ('last_login', 'last_logout', 'status');

-- Check current staff sessions
SELECT 'CURRENT ACTIVE STAFF SESSIONS...' as step;
SELECT * FROM staff_session WHERE is_active = 1;

-- Check last login times for inspectors
SELECT 'INSPECTOR LAST LOGIN TIMES...' as step;
SELECT inspector_id, username, first_name, last_name, status, last_login
FROM inspector
WHERE status = 'active'
ORDER BY last_login DESC
LIMIT 10;

-- Check last login times for collectors
SELECT 'COLLECTOR LAST LOGIN TIMES...' as step;
SELECT collector_id, username, first_name, last_name, status, last_login
FROM collector
WHERE status = 'active'
ORDER BY last_login DESC
LIMIT 10;

SELECT 'VERIFICATION COMPLETE!' as status;
