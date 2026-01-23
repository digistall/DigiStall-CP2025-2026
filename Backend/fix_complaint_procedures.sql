-- =============================================
-- Fix Complaint Stored Procedures
-- Issue: Procedures reference non-existent encrypted columns
-- Fix: Use actual column names from stallholder and applicant tables
-- Date: January 23, 2026
-- =============================================

DELIMITER $$

-- =============================================
-- Fix: sp_getStallholderDetailsForComplaintDecrypted
-- Problem: References sh.is_encrypted, sh.encrypted_name, sh.encrypted_contact, sh.encrypted_email (don't exist)
-- Solution: Use actual columns: sh.full_name, sh.contact_number, sh.email
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallholderDetailsForComplaintDecrypted$$

CREATE PROCEDURE sp_getStallholderDetailsForComplaintDecrypted(
  IN p_stallholder_id INT
)
BEGIN
  -- Get stallholder info with proper column names from actual table
  SELECT
    sh.stallholder_id,
    sh.full_name as sender_name,
    sh.contact_number as sender_contact,
    sh.email as sender_email,
    sh.branch_id,
    sh.stall_id,
    s.stall_no as stall_number,
    'stallholder' as source
  FROM stallholder sh
  LEFT JOIN stall s ON sh.stall_id = s.stall_id
  WHERE sh.stallholder_id = p_stallholder_id 
     OR sh.applicant_id = p_stallholder_id
  LIMIT 1;
END$$
DELIMITER ;
-- =============================================
-- Fix: sp_getApplicantDetailsForComplaintDecrypted
-- Problem: References a.is_encrypted, a.encrypted_full_name, a.encrypted_contact, a.encrypted_email (don't exist)
-- Solution: Use actual columns: a.applicant_full_name, a.applicant_contact_number, a.applicant_email
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDetailsForComplaintDecrypted$$

CREATE PROCEDURE sp_getApplicantDetailsForComplaintDecrypted(
  IN p_applicant_id INT
)
BEGIN
  -- Get applicant data with proper column names
  -- NOTE: applicant table does NOT have an email column, only email_verified (boolean)
  SELECT
    a.applicant_id,
    a.applicant_full_name as sender_name,
    a.applicant_contact_number as sender_contact,
    NULL as sender_email,
    NULL as branch_id,
    NULL as stall_id,
    NULL as stall_number,
    'applicant' as source
  FROM applicant a
  WHERE a.applicant_id = p_applicant_id
  LIMIT 1;
END$$

DELIMITER ;

-- =============================================
-- Verification Queries (Run these after executing the above)
-- =============================================

-- Test the procedures with a sample ID
-- CALL sp_getStallholderDetailsForComplaintDecrypted(1);
-- CALL sp_getApplicantDetailsForComplaintDecrypted(1);

-- Check if procedures were created successfully
-- SHOW PROCEDURE STATUS WHERE Db = DATABASE() AND Name LIKE '%complaint%';
