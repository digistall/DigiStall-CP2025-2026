-- Reset password for inspector INS6765 to a known value
-- This will set the password to: Inspector@123
-- Bcrypt hash for "Inspector@123" 
UPDATE inspector 
SET password_hash = '$2a$12$LKJ7Dd4HYqE8zU8QJxZ3WOvXsVVvZxJCd5g.h7KqY9MJ4s0YnVPnK'
WHERE username = 'INS6765';

-- Verify the update
SELECT 
    inspector_id,
    username,
    CONCAT(first_name, ' ', last_name) as full_name,
    LEFT(password_hash, 30) as password_hash_preview,
    status
FROM inspector
WHERE username = 'INS6765';
