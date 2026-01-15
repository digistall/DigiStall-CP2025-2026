-- ============================================================
-- ENCRYPTION SYSTEM - FINAL WORKING CONFIGURATION
-- ============================================================
-- This file documents the encryption system that is now working.
-- Data is encrypted using AES-256-CBC with a random 16-byte IV.
-- Encrypted data is stored in encrypted_* VARBINARY columns.
-- Original columns show '***ENCRYPTED***' as placeholders.
--
-- USAGE:
-- - Use sp_*Decrypted() procedures to SELECT data (auto-decrypts)
-- - Use sp_encrypt_all_sensitive_data() to encrypt existing plain text
-- - New INSERT procedures automatically encrypt
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- fn_encrypt_value: Encrypts plain text with random IV
-- Returns: VARBINARY containing IV (16 bytes) + Ciphertext
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_encrypt_value(
  plain_text VARCHAR(2000), 
  enc_key VARCHAR(64)
)
RETURNS VARBINARY(4096)
DETERMINISTIC
BEGIN
  DECLARE iv VARBINARY(16);
  DECLARE encrypted VARBINARY(4096);
  
  IF plain_text IS NULL OR plain_text = '' THEN 
    RETURN NULL; 
  END IF;
  
  SET iv = RANDOM_BYTES(16);
  SET encrypted = AES_ENCRYPT(plain_text, UNHEX(enc_key), iv);
  
  RETURN CONCAT(iv, encrypted);
END //
DELIMITER ;

-- fn_decrypt_value: Decrypts data encrypted by fn_encrypt_value
-- Extracts IV from first 16 bytes, decrypts remaining ciphertext
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_decrypt_value(
  encrypted_data VARBINARY(4096), 
  enc_key VARCHAR(64)
)
RETURNS VARCHAR(2000)
DETERMINISTIC
BEGIN
  DECLARE iv VARBINARY(16);
  DECLARE cipher_text VARBINARY(4096);
  DECLARE decrypted VARCHAR(2000);
  
  IF encrypted_data IS NULL OR LENGTH(encrypted_data) < 17 THEN 
    RETURN NULL; 
  END IF;
  
  SET iv = SUBSTRING(encrypted_data, 1, 16);
  SET cipher_text = SUBSTRING(encrypted_data, 17);
  SET decrypted = AES_DECRYPT(cipher_text, UNHEX(enc_key), iv);
  
  RETURN decrypted;
END //
DELIMITER ;

-- ============================================================
-- ENCRYPTION KEY
-- ============================================================
-- The encryption key is stored in the encryption_keys table:
-- SELECT encryption_key FROM encryption_keys 
-- WHERE key_name = 'user_data_key' AND is_active = 1;
--
-- Key: da97ee333e18b86ce9326ee721eb5ed3d4f65a74566c22130927d96fd26a59b8
-- ============================================================

-- ============================================================
-- DECRYPTION PROCEDURES (use these in controllers)
-- ============================================================

-- sp_getAllStallholdersAllDecrypted: Get all stallholders with decrypted PII
-- sp_getAllStallholdersByBranchesDecrypted(branchIds): Get stallholders by branches
-- sp_getBusinessEmployeesAllDecrypted: Get all business employees with decrypted PII
-- sp_getAllCollectorsDecrypted: Get all collectors with decrypted PII
-- sp_getAllInspectorsDecrypted: Get all inspectors with decrypted PII
-- sp_getAllApplicantsDecrypted: Get all applicants with decrypted PII
-- getStallholdersByBranch(branch_id): Get stallholders by single branch

-- ============================================================
-- ENCRYPTION PROCEDURES
-- ============================================================

-- sp_encrypt_all_sensitive_data(): Master procedure to encrypt all tables
-- sp_encrypt_all_stallholders(): Encrypt all stallholder PII
-- sp_encrypt_all_business_employees(): Encrypt all business employee PII
-- sp_encrypt_all_business_managers(): Encrypt all business manager PII
-- sp_encrypt_all_collectors(): Encrypt all collector PII
-- sp_encrypt_all_inspectors(): Encrypt all inspector PII
-- sp_encrypt_all_applicants(): Encrypt all applicant PII
-- sp_encrypt_all_spouses(): Encrypt all spouse PII

-- ============================================================
-- TABLE STRUCTURE REQUIREMENTS
-- ============================================================
-- Each table with PII must have:
-- 1. Original VARCHAR columns (stallholder_name, email, etc.)
-- 2. encrypted_* VARBINARY columns (encrypted_name, encrypted_email, etc.)
-- 3. is_encrypted TINYINT(1) flag
--
-- Example for stallholder:
-- ALTER TABLE stallholder ADD COLUMN encrypted_name VARBINARY(2048);
-- ALTER TABLE stallholder ADD COLUMN encrypted_email VARBINARY(2048);
-- ALTER TABLE stallholder ADD COLUMN encrypted_contact VARBINARY(2048);
-- ALTER TABLE stallholder ADD COLUMN encrypted_address VARBINARY(2048);
-- ALTER TABLE stallholder ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
-- ============================================================

-- ============================================================
-- IMPORTANT NOTES
-- ============================================================
-- 1. Always SET SESSION block_encryption_mode = 'aes-256-cbc' before operations
-- 2. The encryption key is fetched from encryption_keys table inside procedures
-- 3. COALESCE is used to return original column value if decryption returns NULL
-- 4. New records should use encrypted INSERT procedures or encrypt after INSERT
-- ============================================================
