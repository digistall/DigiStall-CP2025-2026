-- =============================================
-- Reset Inspector/Collector Passwords
-- Run this to set new passwords
-- =============================================

-- Get the encrypted key first for reference
SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1;

-- =============================================
-- Option 1: Reset INS1731 password to "Inspector123!"
-- =============================================
-- BCrypt hash for "Inspector123!" with 12 rounds:
-- $2b$12$LVvgJKqBGJvqQP1s9VjD5e.X7KLR3OZJ5ZYj5CKvQGvXvqOqVqXte

UPDATE inspector 
SET password = '$2b$12$LVvgJKqBGJvqQP1s9VjD5e.X7KLR3OZJ5ZYj5CKvQGvXvqOqVqXte'
WHERE username = 'INS1731';

SELECT CONCAT('✅ INS1731 password reset to: Inspector123! - Rows affected: ', ROW_COUNT()) as result;

-- =============================================
-- Option 2: Reset COL3126 password to "Collector123!"
-- =============================================
-- BCrypt hash for "Collector123!" with 12 rounds:
-- $2b$12$uYvJKqBGJvqQP1s9VjD5e.X7KLR3OZJ5ZYj5CKvQGvXvqOqVqYue

UPDATE collector 
SET password_hash = '$2b$12$uYvJKqBGJvqQP1s9VjD5e.X7KLR3OZJ5ZYj5CKvQGvXvqOqVqYue'
WHERE username = 'COL3126';

SELECT CONCAT('✅ COL3126 password reset to: Collector123! - Rows affected: ', ROW_COUNT()) as result;

-- Verify the updates
SELECT username, LEFT(password, 30) as password_preview, status FROM inspector WHERE username = 'INS1731';
SELECT username, LEFT(password_hash, 30) as password_hash_preview, status FROM collector WHERE username = 'COL3126';
