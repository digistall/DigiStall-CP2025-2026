-- ============================================================
-- Stored Procedure: sp_updateBranchDocumentRequirement
-- Description:
--   Updates is_required and instructions on an existing
--   branch_document_requirements row identified by requirement_id.
--   The branch_id scope check prevents cross-branch tampering.
--
--   For business owners who manage multiple branches, call this SP
--   once per branch (each with the matching branch_id).
--
-- Parameters:
--   p_requirement_id  INT     - PK of the row to update
--   p_branch_id       INT     - Must match the row's branch_id (security scope)
--   p_is_required     TINYINT - 1 = required, 0 = optional
--   p_instructions    TEXT    - Special instructions (nullable)
--
-- Result set returned:
--   affected_rows  INT - 1 on success, 0 if not found or scope mismatch
-- ============================================================

DROP PROCEDURE IF EXISTS sp_updateBranchDocumentRequirement;

DELIMITER $$

CREATE PROCEDURE sp_updateBranchDocumentRequirement(
  IN p_requirement_id INT,
  IN p_branch_id      INT,
  IN p_is_required    TINYINT,
  IN p_instructions   TEXT
)
BEGIN
  UPDATE branch_document_requirements
  SET
    is_required  = p_is_required,
    instructions = p_instructions,
    updated_at   = NOW()
  WHERE requirement_id = p_requirement_id
    AND branch_id      = p_branch_id;

  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;
