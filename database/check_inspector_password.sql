-- Check inspector INS6765 password details
SELECT 
    inspector_id,
    username,
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    branch_id,
    status,
    LEFT(password_hash, 30) as password_hash_preview,
    date_hired,
    last_login
FROM inspector
WHERE username = 'INS6765' OR inspector_id = 6;

-- Check all inspectors to compare
SELECT 
    inspector_id,
    username,
    CONCAT(first_name, ' ', last_name) as full_name,
    branch_id,
    status,
    LEFT(password_hash, 30) as password_hash_preview
FROM inspector
WHERE status = 'active'
ORDER BY branch_id, username;
