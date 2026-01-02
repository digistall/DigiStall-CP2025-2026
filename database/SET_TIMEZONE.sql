-- =====================================================
-- SET MYSQL TIMEZONE TO PHILIPPINE TIME
-- Run this FIRST before the FIX_EMPLOYEE_ONLINE_STATUS.sql
-- =====================================================

-- Note: You don't have SUPER privileges, so we'll set session timezone only
-- This affects your current session

-- Set session timezone to Philippine Time
SET time_zone = '+08:00';

-- Verify the timezone
SELECT @@global.time_zone, @@session.time_zone, NOW() as current_time;

-- =====================================================
-- IMPORTANT: For permanent timezone fix
-- =====================================================
-- Add this to your MySQL configuration file:
-- 
-- Windows: C:\ProgramData\MySQL\MySQL Server 8.0\my.ini
-- Add under [mysqld] section:
--     default-time-zone = '+08:00'
-- 
-- Then restart MySQL service:
-- 1. Open Services (Win+R, type services.msc)
-- 2. Find "MySQL80" or "MySQL"
-- 3. Right-click -> Restart
-- =====================================================
