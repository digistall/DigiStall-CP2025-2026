-- Update sp_getStallholderIdByApplicant to return ALL stallholder_ids for an applicant
-- FIX: Remove LIMIT 1 to support multiple stalls

DROP PROCEDURE IF EXISTS sp_getStallholderIdByApplicant;
DELIMITER 30
CREATE PROCEDURE sp_getStallholderIdByApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT stallholder_id
    FROM stallholder
    WHERE applicant_id = p_applicant_id;
END30
DELIMITER ;
