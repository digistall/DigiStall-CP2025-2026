-- Check the violation_report table data
SELECT 
    report_id,
    inspector_id,
    date_reported,
    compliance_type
FROM violation_report
WHERE report_id IN (5, 6, 7)
ORDER BY report_id;

-- Check which inspectors exist
SELECT 
    inspector_id,
    username,
    first_name,
    last_name,
    encrypted_first_name IS NOT NULL as has_enc_first,
    encrypted_last_name IS NOT NULL as has_enc_last,
    is_encrypted,
    status
FROM inspector
WHERE inspector_id IN (
    SELECT DISTINCT inspector_id 
    FROM violation_report 
    WHERE report_id IN (5, 6, 7) AND inspector_id IS NOT NULL
);

-- Check if there are inspectors without encrypted data
SELECT 
    inspector_id,
    username,
    first_name,
    last_name,
    LENGTH(first_name) as first_name_len,
    LENGTH(last_name) as last_name_len,
    encrypted_first_name IS NOT NULL as has_enc_first,
    encrypted_last_name IS NOT NULL as has_enc_last,
    is_encrypted
FROM inspector
WHERE status = 'active';
