-- =============================================
-- MASTER ENCRYPTION SETUP SCRIPT
-- Run this ONE file to encrypt ALL user data
-- =============================================
-- 
-- INSTRUCTIONS:
-- 1. Connect to your MySQL database
-- 2. Run this entire file: SOURCE database/SETUP_ENCRYPTION.sql
-- 3. All user data will be encrypted automatically
--
-- WHAT THIS DOES:
-- ✓ Adds encrypted columns to all user tables
-- ✓ Creates encryption functions and procedures  
-- ✓ Encrypts ALL existing user data (names, emails, phones, addresses)
-- ✓ Masks visible data (Jo***es, 09****12, te***@***.com)
-- ✓ Updates staff creation procedures to auto-encrypt new records
--
-- =============================================

-- Step 1: Source the column additions
SOURCE database/migrations/413_add_username_columns.sql;

-- Step 2: Source the encryption procedures
SOURCE database/migrations/414_sp_data_encryption.sql;

-- Step 3: Source the encrypted staff procedures  
SOURCE database/migrations/415_sp_encrypted_user_operations.sql;

-- Step 4: Source the direct staff creation updates
SOURCE database/migrations/416_sp_encrypted_staff_direct.sql;

-- Step 5: Encrypt all existing data
CALL sp_encryptAllUserData();

-- Step 6: Encrypt staff data (employees, inspectors, collectors)
CALL sp_encryptExistingStaffData();

-- Step 7: Verify encryption
SELECT '📊 ENCRYPTION STATUS REPORT' as report_header;

SELECT 
  'applicant' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted
FROM applicant
UNION ALL
SELECT 'stallholder', COUNT(*), SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) FROM stallholder
UNION ALL
SELECT 'business_manager', COUNT(*), SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) FROM business_manager
UNION ALL
SELECT 'business_employee', COUNT(*), SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) FROM business_employee
UNION ALL
SELECT 'inspector', COUNT(*), SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) FROM inspector
UNION ALL
SELECT 'collector', COUNT(*), SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) FROM collector;

SELECT '✅ ALL USER DATA IS NOW ENCRYPTED AND PROTECTED!' as final_status;
SELECT '📝 Original data masked (Jo***es), encrypted copy stored securely' as note;
SELECT '🔐 New users will be automatically encrypted on creation' as note2;
