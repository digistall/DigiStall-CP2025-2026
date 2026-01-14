-- Check all active inspectors and their password hashes
-- This helps identify if there's a pattern or common password

SELECT 
    i.inspector_id,
    i.username,
    CONCAT(i.first_name, ' ', IFNULL(i.middle_name, ''), ' ', i.last_name) as full_name,
    i.email,
    i.branch_id,
    b.branch_name,
    i.status,
    LEFT(i.password_hash, 50) as password_hash_preview,
    CASE 
        WHEN i.password_hash LIKE '$2a$%' THEN 'bcrypt'
        WHEN i.password_hash LIKE '$2b$%' THEN 'bcrypt'
        WHEN LENGTH(i.password_hash) = 64 THEN 'SHA256'
        WHEN i.password_hash = '' OR i.password_hash IS NULL THEN 'NO HASH'
        ELSE 'UNKNOWN'
    END as hash_type,
    i.date_hired,
    i.date_created
FROM inspector i
LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'active'
LEFT JOIN branch b ON ia.branch_id = b.branch_id
WHERE i.status = 'active'
ORDER BY i.branch_id, i.inspector_id;

-- Also check collectors
SELECT 
    c.collector_id,
    c.username,
    CONCAT(c.first_name, ' ', IFNULL(c.middle_name, ''), ' ', c.last_name) as full_name,
    c.email,
    c.status,
    LEFT(c.password_hash, 50) as password_hash_preview,
    CASE 
        WHEN c.password_hash LIKE '$2a$%' THEN 'bcrypt'
        WHEN c.password_hash LIKE '$2b$%' THEN 'bcrypt'
        WHEN LENGTH(c.password_hash) = 64 THEN 'SHA256'
        WHEN c.password_hash = '' OR c.password_hash IS NULL THEN 'NO HASH'
        ELSE 'UNKNOWN'
    END as hash_type,
    c.date_hired,
    c.date_created
FROM collector c
WHERE c.status = 'active'
ORDER BY c.collector_id;
