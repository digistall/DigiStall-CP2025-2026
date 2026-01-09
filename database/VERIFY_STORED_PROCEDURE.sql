-- =============================================
-- VERIFY STORED PROCEDURE CONTENT
-- Run this to check if sp_getInspectorByUsername was actually updated
-- =============================================

USE naga_stall;

-- Check the actual procedure definition
SHOW CREATE PROCEDURE sp_getInspectorByUsername;

-- Also check collector
SHOW CREATE PROCEDURE sp_getCollectorByUsername;

-- Direct test - call the procedure
SELECT '===== TESTING sp_getInspectorByUsername with INS1731 =====' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT '===== TESTING sp_getCollectorByUsername with CO_3126 =====' as test;
CALL sp_getCollectorByUsername('CO_3126');
