-- =============================================
-- Test Script: Check Stallholder Data for Complaints
-- =============================================

-- Check stallholder record for ID 1
SELECT 
    stallholder_id,
    applicant_id,
    stallholder_name,
    contact_number,
    email,
    branch_id,
    stall_id,
    is_encrypted,
    encrypted_name IS NOT NULL as has_encrypted_name,
    encrypted_contact IS NOT NULL as has_encrypted_contact,
    encrypted_email IS NOT NULL as has_encrypted_email
FROM stallholder 
WHERE stallholder_id = 1 OR applicant_id = 1;

-- Check if there's an application with stall assignment
SELECT 
    app.application_id,
    app.applicant_id,
    app.status,
    al.stall_id,
    al.branch_id,
    s.stall_number,
    s.floor_number,
    b.branch_name
FROM application app
LEFT JOIN assigned_location al ON app.application_id = al.application_id
LEFT JOIN stall s ON al.stall_id = s.stall_id
LEFT JOIN branch b ON al.branch_id = b.branch_id
WHERE app.applicant_id = 1 
AND app.status = 'Approved'
ORDER BY app.application_id DESC
LIMIT 5;

-- Test the stored procedure
CALL sp_getStallholderDetailsForComplaintDecrypted(1);

-- Check applicant as fallback
SELECT 
    applicant_id,
    applicant_full_name,
    applicant_contact_number,
    applicant_email,
    is_encrypted,
    encrypted_full_name IS NOT NULL as has_encrypted_name,
    encrypted_contact IS NOT NULL as has_encrypted_contact,
    encrypted_email IS NOT NULL as has_encrypted_email
FROM applicant
WHERE applicant_id = 1;

-- Test applicant procedure
CALL sp_getApplicantDetailsForComplaintDecrypted(1);
