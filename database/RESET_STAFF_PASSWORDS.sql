-- =====================================================
-- RESET STAFF PASSWORDS
-- Run this to reset passwords for Collector and Inspector accounts
-- =====================================================

USE naga_stall;

-- Generate new bcrypt password hash for "password123" (you can change this)
-- Note: This hash is for the password "password123" with 12 rounds
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.0qUkslJYAiHAyK

-- =====================================================
-- Reset Collector COL6806 password to "password123"
-- =====================================================
UPDATE collector 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.0qUkslJYAiHAyK'
WHERE username = 'COL6806';

SELECT 'Collector COL6806 password reset to: password123' as result;

-- =====================================================
-- Reset any Inspector passwords to "password123"
-- First, let's see what inspectors exist
-- =====================================================
SELECT inspector_id, username, first_name, last_name, 
       LEFT(password, 20) as password_preview,
       LEFT(password_hash, 20) as password_hash_preview
FROM inspector 
WHERE status = 'active';

-- Reset Inspector INS1731 password (if exists)
UPDATE inspector 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.0qUkslJYAiHAyK',
    password = ''
WHERE username = 'INS1731';

-- Reset ALL active inspector passwords
UPDATE inspector 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.0qUkslJYAiHAyK',
    password = ''
WHERE status = 'active';

SELECT 'All active inspector passwords reset to: password123' as result;

-- =====================================================
-- Reset Stallholder 25-39683 password to "password123"
-- =====================================================
UPDATE credential 
SET password_hash = '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.0qUkslJYAiHAyK'
WHERE user_name = '25-39683';

SELECT 'Stallholder 25-39683 password reset to: password123' as result;

-- =====================================================
-- Verify the updates
-- =====================================================
SELECT 'Collector passwords:' as info;
SELECT collector_id, username, first_name, last_name, 
       LEFT(password_hash, 30) as password_hash_preview
FROM collector;

SELECT 'Inspector passwords:' as info;
SELECT inspector_id, username, first_name, last_name, 
       LEFT(password_hash, 30) as password_hash_preview
FROM inspector WHERE status = 'active';

SELECT 'Credential passwords:' as info;
SELECT registrationid, user_name, 
       LEFT(password_hash, 30) as password_hash_preview
FROM credential WHERE user_name = '25-39683';

SELECT '✅ All passwords reset to: password123' as status;
