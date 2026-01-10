-- =============================================
-- Re-encrypt Inspector ID 4 and Collector ID 5 with New Format
-- Decrypts old data and re-encrypts with TO_BASE64(AES_ENCRYPT) format
-- =============================================

-- Re-encrypt inspector ID 4
UPDATE inspector i
JOIN encryption_keys ek ON ek.key_name = 'user_data_key' AND ek.is_active = 1
SET 
    i.first_name = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(i.first_name), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    i.last_name = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(i.last_name), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    i.middle_name = IF(i.middle_name IS NOT NULL, TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(i.middle_name), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )), NULL),
    i.email = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(i.email), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    i.contact_no = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(i.contact_no), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    i.is_encrypted = 1
WHERE i.inspector_id = 4;

-- Re-encrypt collector ID 5  
UPDATE collector c
JOIN encryption_keys ek ON ek.key_name = 'user_data_key' AND ek.is_active = 1
SET 
    c.first_name = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(c.first_name), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    c.last_name = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(c.last_name), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    c.middle_name = IF(c.middle_name IS NOT NULL, TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(c.middle_name), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )), NULL),
    c.email = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(c.email), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    c.contact_no = TO_BASE64(AES_ENCRYPT(
        CAST(AES_DECRYPT(FROM_BASE64(c.contact_no), ek.encryption_key) AS CHAR(500)),
        ek.encryption_key
    )),
    c.is_encrypted = 1
WHERE c.collector_id = 5;

SELECT 'Inspector ID 4 and Collector ID 5 re-encrypted successfully!' as status;
