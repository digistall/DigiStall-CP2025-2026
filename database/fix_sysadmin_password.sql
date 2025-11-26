-- Fix sysadmin password
UPDATE system_administrator 
SET password_hash = '$2b$12$ZeU7W7K6xmviVoqgaHoK9uYL2lMuD98DLd3yffXi0WfM6l2vHSQWa' 
WHERE username = 'sysadmin';

-- Verify the update
SELECT system_admin_id, username, email, status 
FROM system_administrator 
WHERE username = 'sysadmin';
