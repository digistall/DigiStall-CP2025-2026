-- ============================================================
-- Stored Procedure: sp_createBranchDocumentRequirement
-- Description:
--   Creates or updates a document requirement for a specific branch.
--   If a row already exists for (branch_id + document_type_id), it
--   performs an UPDATE instead of INSERT (upsert behaviour).
--
-- Parameters:
--   p_branch_id             INT     - The branch to set the requirement for
--   p_document_type_id      INT     - The document type being required
--   p_is_required           TINYINT - 1 = required, 0 = optional
--   p_instructions          TEXT    - Special instructions (nullable)
--   p_created_by_manager_id INT     - business_manager_id of the creator
--                                     (resolve employee → manager before calling)
--
-- Result set returned:
--   requirement_id  INT    - The inserted or updated row id
--   action          VARCHAR - 'CREATED' or 'UPDATED'
--   affected_rows   INT    - Always 1 on success
-- ============================================================

DROP PROCEDURE IF EXISTS sp_createBranchDocumentRequirement;

DELIMITER $$

CREATE PROCEDURE sp_createBranchDocumentRequirement(
  IN p_branch_id             INT,
  IN p_document_type_id      INT,
  IN p_is_required           TINYINT,
  IN p_instructions          TEXT,
  IN p_created_by_manager_id INT
)
BEGIN
  DECLARE v_existing_id   INT DEFAULT NULL;
  DECLARE v_doc_type_exists INT DEFAULT 0;
  DECLARE v_action        VARCHAR(10) DEFAULT 'CREATED';

  -- Validate that the document type exists and is active
  SELECT COUNT(*) INTO v_doc_type_exists
  FROM document_types
  WHERE document_type_id = p_document_type_id AND status = 'Active';

  IF v_doc_type_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid or inactive document type';
  END IF;

  -- Check for an existing requirement on this branch + document type
  SELECT requirement_id INTO v_existing_id
  FROM branch_document_requirements
  WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- UPDATE the existing row
    SET v_action = 'UPDATED';
    UPDATE branch_document_requirements
    SET
      is_required  = p_is_required,
      instructions = p_instructions,
      updated_at   = NOW()
    WHERE requirement_id = v_existing_id;
  ELSE
    -- INSERT a new row
    INSERT INTO branch_document_requirements
      (branch_id, document_type_id, is_required, instructions, created_by_business_manager, created_at)
    VALUES
      (p_branch_id, p_document_type_id, p_is_required, p_instructions, p_created_by_manager_id, NOW());

    SET v_existing_id = LAST_INSERT_ID();
  END IF;

  -- Return result set
  SELECT
    v_existing_id AS requirement_id,
    v_action      AS action,
    1             AS affected_rows;
END$$

DELIMITER ;
