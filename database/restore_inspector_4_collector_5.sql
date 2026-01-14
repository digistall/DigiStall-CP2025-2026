-- =============================================
-- Restore Inspector ID 4 and Collector ID 5 with Correct Encryption
-- Uses TO_BASE64(AES_ENCRYPT()) format like new records
-- =============================================

-- Restore Inspector ID 4: Shaikim Lu
UPDATE inspector i
JOIN encryption_keys ek ON ek.key_name = 'user_data_key' AND ek.is_active = 1
SET 
    i.first_name = TO_BASE64(AES_ENCRYPT('Shaikim', ek.encryption_key)),
    i.last_name = TO_BASE64(AES_ENCRYPT('Lu', ek.encryption_key)),
    i.middle_name = NULL,
    i.email = TO_BASE64(AES_ENCRYPT('shaikim@example.com', ek.encryption_key)),
    i.contact_no = TO_BASE64(AES_ENCRYPT('03987456321', ek.encryption_key)),
    i.is_encrypted = 1
WHERE i.inspector_id = 4;

-- Restore Collector ID 5: Giuseppe Arnaldo
-- (Need contact number - using placeholder, please update if you have it)
UPDATE collector c
JOIN encryption_keys ek ON ek.key_name = 'user_data_key' AND ek.is_active = 1
SET 
    c.first_name = TO_BASE64(AES_ENCRYPT('Giuseppe', ek.encryption_key)),
    c.last_name = TO_BASE64(AES_ENCRYPT('Arnaldo', ek.encryption_key)),
    c.middle_name = NULL,
    c.email = TO_BASE64(AES_ENCRYPT('archivistdox76@gmail.com', ek.encryption_key)),
    c.contact_no = TO_BASE64(AES_ENCRYPT('09123456789', ek.encryption_key)),
    c.is_encrypted = 1
WHERE c.collector_id = 5;

SELECT 'Inspector ID 4 and Collector ID 5 data restored with proper encryption!' as status;
