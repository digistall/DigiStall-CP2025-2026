-- Fix missing stallholder records for approved applicants
-- This migration creates stallholder records for approved applicants who don't have one

-- First, let's see what we're dealing with
SELECT 
    'Approved applicants without stallholder record' as check_type,
    COUNT(*) as count
FROM application app
JOIN applicant a ON app.applicant_id = a.applicant_id
LEFT JOIN stallholder sh ON a.applicant_id = sh.applicant_id
WHERE app.application_status = 'Approved'
  AND sh.stallholder_id IS NULL;

-- Create stallholder records for approved applicants without one
INSERT INTO stallholder (
    applicant_id,
    stallholder_name,
    contact_number,
    email,
    address,
    business_name,
    business_type,
    branch_id,
    stall_id,
    contract_start_date,
    contract_end_date,
    contract_status,
    lease_amount,
    monthly_rent,
    payment_status,
    compliance_status,
    date_created
)
SELECT 
    a.applicant_id,
    a.applicant_full_name,
    a.applicant_contact_number,
    COALESCE(oi.email_address, a.applicant_email),
    a.applicant_address,
    bi.nature_of_business,
    bi.nature_of_business,
    f.branch_id,
    app.stall_id,
    CURDATE() as contract_start_date,
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR) as contract_end_date,
    'Active' as contract_status,
    COALESCE(st.rental_price, 0) as lease_amount,
    COALESCE(st.rental_price, 0) as monthly_rent,
    'pending' as payment_status,
    'Compliant' as compliance_status,
    NOW() as date_created
FROM application app
JOIN applicant a ON app.applicant_id = a.applicant_id
LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
JOIN stall st ON app.stall_id = st.stall_id
JOIN section sec ON st.section_id = sec.section_id
JOIN floor f ON sec.floor_id = f.floor_id
LEFT JOIN stallholder sh ON a.applicant_id = sh.applicant_id
WHERE app.application_status = 'Approved'
  AND sh.stallholder_id IS NULL;

-- Update the stalls to be marked as occupied
UPDATE stall st
JOIN application app ON st.stall_id = app.stall_id
SET st.is_available = 0, 
    st.status = 'Occupied',
    st.updated_at = NOW()
WHERE app.application_status = 'Approved'
  AND (st.is_available = 1 OR st.status != 'Occupied');

-- Verify the fix
SELECT 
    sh.stallholder_id,
    sh.stallholder_name,
    sh.stall_id,
    sh.branch_id,
    sh.contract_status,
    sh.payment_status,
    st.stall_no,
    b.branch_name
FROM stallholder sh
LEFT JOIN stall st ON sh.stall_id = st.stall_id
LEFT JOIN branch b ON sh.branch_id = b.branch_id
ORDER BY sh.stallholder_id DESC;

SELECT 'Migration completed successfully!' as status;
