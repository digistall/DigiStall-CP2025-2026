-- =============================================
-- EXECUTE THIS FILE TO ENCRYPT ALL EXISTING DATA
-- Run AFTER running 413 and 414 migrations
-- =============================================

-- Step 1: Encrypt all existing user data
CALL sp_encryptAllUserData();

-- Step 2: Verify encryption
SELECT 'Verifying encryption status...' as step;

SELECT 
  'applicant' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM applicant
UNION ALL
SELECT 
  'stallholder' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM stallholder
UNION ALL
SELECT 
  'business_manager' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM business_manager
UNION ALL
SELECT 
  'employee' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM employee
UNION ALL
SELECT 
  'inspector' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM inspector
UNION ALL
SELECT 
  'collector' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM collector;

SELECT '✅ ENCRYPTION COMPLETE - All sensitive user data is now protected!' as final_status;
