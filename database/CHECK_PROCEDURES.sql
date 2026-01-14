-- Check if stored procedures exist
USE naga_stall;

SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME IN (
    'sp_getActiveSessionsAll',
    'sp_getActiveSessionsByBranches',
    'sp_createOrUpdateEmployeeSession',
    'sp_endEmployeeSession',
    'sp_createOrUpdateStaffSession',
    'sp_endStaffSession'
)
ORDER BY ROUTINE_NAME;

-- Check if staff_session table exists
SELECT TABLE_NAME, CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'naga_stall'
AND TABLE_NAME = 'staff_session';

-- Check employee_session structure
DESCRIBE employee_session;

-- Test calling the procedure
CALL sp_getActiveSessionsAll();
