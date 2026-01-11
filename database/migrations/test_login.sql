-- Test login procedures
SELECT 'Testing INS1731' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT 'Testing COL3126' as test;
CALL sp_getCollectorByUsername('COL3126');

-- Show all procedures related to login
SELECT ROUTINE_NAME 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME LIKE '%Inspector%' OR ROUTINE_NAME LIKE '%Collector%';
