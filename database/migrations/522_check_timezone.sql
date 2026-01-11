-- Check current timezone settings
SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as current_now;

-- Check actual last_login value for inspector 5
SELECT 
    inspector_id,
    username,
    last_login as raw_last_login,
    CONVERT_TZ(last_login, '+00:00', '+08:00') as converted_ph_time,
    NOW() as current_now,
    CONVERT_TZ(NOW(), @@session.time_zone, '+08:00') as current_ph_time
FROM inspector 
WHERE inspector_id = 5;
