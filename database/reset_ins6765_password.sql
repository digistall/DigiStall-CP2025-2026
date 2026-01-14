-- Reset password for inspector INS6765
-- This sets the password to: 7TM322L75K
-- You need to generate the bcrypt hash for this password first

-- Option 1: If you want password "7TM322L75K", run this Node.js command first:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('7TM322L75K', 12).then(hash => console.log(hash));"
-- Then replace the hash below with the generated hash

-- Option 2: Use this pre-generated hash for "Inspector@123"
UPDATE inspector 
SET password_hash = '$2a$12$LKJ7Dd4HYqE8zU8QJxZ3WOvXsVVvZxJCd5g.h7KqY9MJ4s0YnVPnK',
    password = ''  -- Clear old plaintext password if any
WHERE username = 'INS6765';

-- Verify the update
SELECT 
    inspector_id,
    username,
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    branch_id,
    status,
    LEFT(password_hash, 40) as password_hash_preview
FROM inspector
WHERE username = 'INS6765';

-- After running this, you can login with:
-- Username: INS6765
-- Password: Inspector@123
