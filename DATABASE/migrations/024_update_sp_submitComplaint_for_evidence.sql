-- ===== MIGRATION 024: UPDATE sp_submitComplaint FOR EVIDENCE BLOB SUPPORT =====
-- This migration updates the sp_submitComplaint stored procedure to convert 
-- incoming base64 evidence text into a LONGBLOB before inserting it.

DROP PROCEDURE IF EXISTS sp_submitComplaint;

CREATE PROCEDURE sp_submitComplaint(
  IN p_complaint_type VARCHAR(100),
  IN p_stallholder_id INT,
  IN p_stall_id INT,
  IN p_branch_id INT,
  IN p_subject VARCHAR(255),
  IN p_description TEXT,
  IN p_evidence_text LONGTEXT
)
BEGIN
  DECLARE v_sender_name VARCHAR(500);
  DECLARE v_sender_contact VARCHAR(500);
  DECLARE v_sender_email VARCHAR(500);
  DECLARE v_evidence_blob LONGBLOB DEFAULT NULL;
  
  -- Fetch sender details from stallholder table
  SELECT full_name, contact_number, email
  INTO v_sender_name, v_sender_contact, v_sender_email
  FROM stallholder
  WHERE stallholder_id = p_stallholder_id
  LIMIT 1;
  
  -- If not found in stallholder, try applicant table
  IF v_sender_name IS NULL THEN
    SELECT full_name, contact_number, email
    INTO v_sender_name, v_sender_contact, v_sender_email
    FROM applicant
    WHERE applicant_id = p_stallholder_id
    LIMIT 1;
  END IF;
  
  -- Convert base64 TEXT to BLOB if evidence is provided
  IF p_evidence_text IS NOT NULL AND p_evidence_text != '' THEN
    SET v_evidence_blob = FROM_BASE64(p_evidence_text);
  END IF;
  
  INSERT INTO complaint (
    complaint_type,
    sender_name,
    sender_contact,
    sender_email,
    stallholder_id,
    stall_id,
    branch_id,
    subject,
    description,
    evidence,
    status,
    created_at
  ) VALUES (
    p_complaint_type,
    v_sender_name,
    v_sender_contact,
    v_sender_email,
    p_stallholder_id,
    p_stall_id,
    p_branch_id,
    p_subject,
    p_description,
    v_evidence_blob,
    'pending',
    NOW()
  );
  
  SELECT LAST_INSERT_ID() as complaint_id;
END;
