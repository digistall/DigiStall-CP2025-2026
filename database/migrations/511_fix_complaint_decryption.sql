-- =============================================
-- 511: Fix Complaint Submission with Encryption Support
-- Adds decrypted versions of complaint-related procedures
-- =============================================

DELIMITER $$

-- =============================================
-- Get stallholder details for complaint (WITH DECRYPTION)
-- This replaces sp_getStallholderDetailsForComplaint
-- Gets stall info from application/assigned_location tables
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallholderDetailsForComplaintDecrypted$$
CREATE PROCEDURE sp_getStallholderDetailsForComplaintDecrypted(
  IN p_stallholder_id INT
)
BEGIN
  DECLARE v_key VARCHAR(255);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Get stallholder info with stall from application/assigned_location
  SELECT 
    sh.stallholder_id,
    -- Decrypt name
    CASE 
      WHEN sh.is_encrypted = 1 AND sh.encrypted_name IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
      ELSE sh.stallholder_name 
    END as sender_name,
    -- Decrypt contact
    CASE 
      WHEN sh.is_encrypted = 1 AND sh.encrypted_contact IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
      ELSE sh.contact_number 
    END as sender_contact,
    -- Decrypt email
    CASE 
      WHEN sh.is_encrypted = 1 AND sh.encrypted_email IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
      ELSE sh.email 
    END as sender_email,
    -- Get branch_id from floor table, stall_id from application
    COALESCE(f.branch_id, sh.branch_id) as branch_id,
    app.stall_id as stall_id,
    -- Get stall number
    s.stall_no as stall_number,
    'stallholder' as source
  FROM stallholder sh
  LEFT JOIN application app ON sh.applicant_id = app.applicant_id AND app.application_status = 'Approved'
  LEFT JOIN stall s ON app.stall_id = s.stall_id
  LEFT JOIN floor f ON s.floor_id = f.floor_id
  WHERE sh.stallholder_id = p_stallholder_id OR sh.applicant_id = p_stallholder_id
  ORDER BY app.application_id DESC
  LIMIT 1;
END$$

-- =============================================
-- Get applicant details for complaint (WITH DECRYPTION)
-- Fallback when stallholder record not found
-- Gets stall info from application/assigned_location tables
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDetailsForComplaintDecrypted$$
CREATE PROCEDURE sp_getApplicantDetailsForComplaintDecrypted(
  IN p_applicant_id INT
)
BEGIN
  DECLARE v_key VARCHAR(255);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Get applicant data with decryption and stall from assigned_location
  SELECT 
    a.applicant_id,
    -- Decrypt full name
    CASE 
      WHEN a.is_encrypted = 1 AND a.encrypted_full_name IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(255))
      ELSE a.applicant_full_name 
    END as sender_name,
    -- Decrypt contact
    CASE 
      WHEN a.is_encrypted = 1 AND a.encrypted_contact IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(50))
      ELSE a.applicant_contact_number 
    END as sender_contact,
    -- Decrypt email
    CASE 
      WHEN a.is_encrypted = 1 AND a.encrypted_email IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(a.encrypted_email, v_key) AS CHAR(255))
      ELSE a.applicant_email 
    END as sender_email,
    -- Get branch_id from floor table, stall_id from application
    f.branch_id,
    app.stall_id,
    -- Get stall number
    s.stall_no as stall_number,
    'applicant' as source
  FROM applicant a
  LEFT JOIN application app ON a.applicant_id = app.applicant_id AND app.application_status = 'Approved'
  LEFT JOIN stall s ON app.stall_id = s.stall_id
  LEFT JOIN floor f ON s.floor_id = f.floor_id
  WHERE a.applicant_id = p_applicant_id
  ORDER BY app.application_id DESC
  LIMIT 1;
END$$

-- =============================================
-- Get complaints by stallholder (WITH DECRYPTION)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getComplaintsByStallholderDecrypted$$
CREATE PROCEDURE sp_getComplaintsByStallholderDecrypted(
  IN p_stallholder_id INT
)
BEGIN
  DECLARE v_key VARCHAR(255);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.subject,
    c.description,
    c.status,
    c.created_at,
    c.updated_at,
    c.resolved_at,
    c.resolution_notes,
    c.stallholder_id,
    c.stall_id,
    c.branch_id,
    -- Decrypt sender info if needed
    CASE 
      WHEN c.sender_name LIKE '%***%' AND v_key IS NOT NULL
      THEN COALESCE(
        (SELECT CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
         FROM stallholder sh WHERE sh.stallholder_id = c.stallholder_id),
        c.sender_name
      )
      ELSE c.sender_name 
    END as sender_name,
    CASE 
      WHEN c.sender_contact LIKE '%***%' AND v_key IS NOT NULL
      THEN COALESCE(
        (SELECT CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
         FROM stallholder sh WHERE sh.stallholder_id = c.stallholder_id),
        c.sender_contact
      )
      ELSE c.sender_contact 
    END as sender_contact,
    CASE 
      WHEN c.sender_email LIKE '%***%' AND v_key IS NOT NULL
      THEN COALESCE(
        (SELECT CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
         FROM stallholder sh WHERE sh.stallholder_id = c.stallholder_id),
        c.sender_email
      )
      ELSE c.sender_email 
    END as sender_email,
    -- Get stall info
    s.stall_no as stall_number,
    -- Get branch info  
    b.branch_name,
    b.location as branch_location
  FROM complaint c
  LEFT JOIN stall s ON c.stall_id = s.stall_id
  LEFT JOIN branch b ON c.branch_id = b.branch_id
  WHERE c.stallholder_id = p_stallholder_id
  ORDER BY c.created_at DESC;
END$$

DELIMITER ;

SELECT '✅ Migration 511 Complete - Complaint procedures with decryption support added!' as status;
