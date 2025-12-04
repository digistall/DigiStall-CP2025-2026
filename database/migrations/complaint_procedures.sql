-- =====================================================
-- COMPLAINT MANAGEMENT STORED PROCEDURES
-- Complete set of procedures for complaint system
-- =====================================================

DELIMITER $$

-- =====================================================
-- Get all complaints with filters
-- =====================================================
DROP PROCEDURE IF EXISTS `getAllComplaints`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllComplaints`(
  IN `p_branch_id` INT,
  IN `p_status` VARCHAR(20),
  IN `p_search` VARCHAR(255)
)
BEGIN
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_id,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    sh.stallholder_name,
    c.stall_id,
    s.stall_no,
    c.branch_id,
    b.branch_name,
    c.subject,
    c.description,
    c.evidence,
    c.status,
    c.priority,
    c.resolution_notes,
    c.date_submitted,
    c.date_resolved,
    c.created_at,
    c.updated_at
  FROM complaint c
  LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
  LEFT JOIN stall s ON c.stall_id = s.stall_id
  LEFT JOIN branch b ON c.branch_id = b.branch_id
  WHERE 
    (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR c.status = p_status)
    AND (
      p_search IS NULL OR p_search = '' OR
      c.complaint_id LIKE CONCAT('%', p_search, '%') OR
      c.complaint_type LIKE CONCAT('%', p_search, '%') OR
      c.sender_name LIKE CONCAT('%', p_search, '%') OR
      sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
      c.subject LIKE CONCAT('%', p_search, '%')
    )
  ORDER BY c.date_submitted DESC;
END$$

-- =====================================================
-- Get complaint by ID
-- =====================================================
DROP PROCEDURE IF EXISTS `getComplaintById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplaintById`(
  IN `p_complaint_id` INT
)
BEGIN
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_id,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    sh.stallholder_name,
    sh.contact_number AS stallholder_contact,
    c.stall_id,
    s.stall_no,
    c.branch_id,
    b.branch_name,
    c.subject,
    c.description,
    c.evidence,
    c.status,
    c.priority,
    c.resolution_notes,
    c.date_submitted,
    c.date_resolved,
    c.created_at,
    c.updated_at
  FROM complaint c
  LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
  LEFT JOIN stall s ON c.stall_id = s.stall_id
  LEFT JOIN branch b ON c.branch_id = b.branch_id
  WHERE c.complaint_id = p_complaint_id;
END$$

-- =====================================================
-- Create new complaint
-- =====================================================
DROP PROCEDURE IF EXISTS `createComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createComplaint`(
  IN `p_complaint_type` VARCHAR(100),
  IN `p_sender_name` VARCHAR(255),
  IN `p_sender_contact` VARCHAR(50),
  IN `p_sender_email` VARCHAR(255),
  IN `p_stallholder_id` INT,
  IN `p_stall_id` INT,
  IN `p_branch_id` INT,
  IN `p_subject` VARCHAR(255),
  IN `p_description` TEXT,
  IN `p_evidence` TEXT,
  IN `p_priority` VARCHAR(20)
)
BEGIN
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
    priority,
    status
  ) VALUES (
    p_complaint_type,
    p_sender_name,
    p_sender_contact,
    p_sender_email,
    p_stallholder_id,
    p_stall_id,
    p_branch_id,
    p_subject,
    p_description,
    p_evidence,
    COALESCE(p_priority, 'medium'),
    'pending'
  );
  
  SELECT LAST_INSERT_ID() AS complaint_id;
END$$

-- =====================================================
-- Update complaint
-- =====================================================
DROP PROCEDURE IF EXISTS `updateComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateComplaint`(
  IN `p_complaint_id` INT,
  IN `p_complaint_type` VARCHAR(100),
  IN `p_subject` VARCHAR(255),
  IN `p_description` TEXT,
  IN `p_priority` VARCHAR(20),
  IN `p_status` VARCHAR(20)
)
BEGIN
  UPDATE complaint
  SET
    complaint_type = COALESCE(p_complaint_type, complaint_type),
    subject = COALESCE(p_subject, subject),
    description = COALESCE(p_description, description),
    priority = COALESCE(p_priority, priority),
    status = COALESCE(p_status, status)
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

-- =====================================================
-- Resolve complaint
-- =====================================================
DROP PROCEDURE IF EXISTS `resolveComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resolveComplaint`(
  IN `p_complaint_id` INT,
  IN `p_resolution_notes` TEXT,
  IN `p_status` VARCHAR(20)
)
BEGIN
  UPDATE complaint
  SET
    status = COALESCE(p_status, 'resolved'),
    resolution_notes = p_resolution_notes,
    date_resolved = NOW()
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

-- =====================================================
-- Delete complaint
-- =====================================================
DROP PROCEDURE IF EXISTS `deleteComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteComplaint`(
  IN `p_complaint_id` INT
)
BEGIN
  DELETE FROM complaint WHERE complaint_id = p_complaint_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;

-- =====================================================
-- Test the procedures
-- =====================================================
-- Test getAllComplaints
CALL getAllComplaints(NULL, 'all', '');

-- Test getComplaintById
CALL getComplaintById(1);
